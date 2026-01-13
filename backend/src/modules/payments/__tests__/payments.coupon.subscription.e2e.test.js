jest.mock('../payments.service', () => ({
  create: jest.fn(async (data) => data),
  STATUS: { PAID: 'paid', PENDING_PAYMENT: 'pending_payment' },
}));

jest.mock('../helpers/validation', () => ({
  validatePaymentData: jest.fn(),
}));

jest.mock('../helpers/platformFee', () => ({
  calculatePlatformFee: jest.fn(async () => ({ platform_fee: 0, instructor_amount: 0 })),
}));

jest.mock('../helpers/enrollment', () => ({
  handleEnrollment: jest.fn(async () => undefined),
}));

jest.mock('../helpers/wallet', () => ({
  creditInstructorWallet: jest.fn(async () => undefined),
  creditInstructorSubscription: jest.fn(async () => undefined),
  creditInstructorFromPayment: jest.fn(async () => undefined),
}));

jest.mock('../helpers/coupon', () => ({
  markCouponRedeemed: jest.fn(async () => undefined),
}));

jest.mock('../../library/library.service', () => ({
  recordPurchase: jest.fn(async () => undefined),
}));

jest.mock('../../users/user.model', () => ({
  findById: jest.fn(async () => ({ id: 'user-1', email: 'user@example.com' })),
}));

jest.mock('../../../services/smsService', () => ({
  sendSMS: jest.fn(async () => undefined),
}));

jest.mock('../../../services/mailService', () => ({
  sendMail: jest.fn(async () => undefined),
}));

jest.mock('../../subscriptions/subscription.service', () => ({
  createOrRenewSubscription: jest.fn(),
}));

jest.mock('../../plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(async () => undefined),
}));

jest.mock('../../invoices/invoices.service', () => ({
  generateFromPayment: jest.fn(async () => null),
}));

jest.mock('../../cart/cart.service', () => ({
  remove: jest.fn(async () => undefined),
}));

jest.mock('../../../services/entitlements', () => ({
  can: jest.fn(),
}));

const controller = require('../payments.controller');
const paymentService = require('../payments.service');
const validation = require('../helpers/validation');
const subscriptionService = require('../../subscriptions/subscription.service');
const plansService = require('../../plans/plans.service');
const entitlements = require('../../../services/entitlements');
const { markCouponRedeemed } = require('../helpers/coupon');

const TEST_TENANTS = [
  {
    id: 'tenant-alpha',
    slug: 'alpha',
    planId: 'plan-basic',
    role: 'student',
    planName: 'Basic Plan',
    planPrice: 120,
  },
  {
    id: 'tenant-beta',
    slug: 'beta',
    planId: 'plan-pro',
    role: 'student',
    planName: 'Pro Plan',
    planPrice: 240,
  },
];

const COUPON_SCENARIOS = [
  {
    name: 'no coupon',
    couponId: null,
    expectedAmount: (tenant) => tenant.planPrice,
    expectedRedeemCalls: 1,
  },
  {
    name: '20 percent discount',
    couponId: 'coupon-20',
    expectedAmount: (tenant) => tenant.planPrice * 0.8,
    expectedRedeemCalls: 1,
  },
];

const subscriptionByTenant = new Map();

beforeAll(() => {
  entitlements.can.mockImplementation(async ({ tenantId }) => {
    const subscription = subscriptionByTenant.get(tenantId);
    return { allow: Boolean(subscription && subscription.status === 'active') };
  });
});

beforeEach(() => {
  subscriptionByTenant.clear();
  jest.clearAllMocks();
});

describe('payment flows with and without coupons', () => {
  const runScenario = async (tenant, scenario) => {
    const expectedAmount = scenario.expectedAmount(tenant);
    const planInterval = 'monthly';

    validation.validatePaymentData.mockResolvedValueOnce({
      method: { id: 'stripe', type: 'stripe' },
      verifiedAmount: expectedAmount,
      verifiedCurrency: 'USD',
      finalStatus: 'paid',
      verifiedReference: `ref-${tenant.slug}-${scenario.name}`,
      planInterval,
      schedules: [],
      next_due_date: null,
      totalInstallments: 1,
      installmentNumber: 1,
      scheduleToClose: null,
      subscriptionPlanId: null,
      subscriptionId: null,
      couponId: scenario.couponId,
    });

    plansService.getPlanById.mockResolvedValueOnce({
      id: tenant.planId,
      name: tenant.planName,
      price_yearly: tenant.planPrice * 10,
    });

    subscriptionService.createOrRenewSubscription.mockImplementationOnce(
      async ({ plan_id, interval }) => {
        const subscription = {
          id: `sub-${tenant.slug}`,
          plan_id,
          status: 'active',
          start_date: new Date(),
          end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          interval,
        };
        subscriptionByTenant.set(tenant.id, subscription);
        return subscription;
      }
    );

    const req = {
      user: { id: 'user-1', role: tenant.role },
      tenant: { id: tenant.id, slug: tenant.slug },
      body: {
        item_type: 'plan',
        item_id: tenant.planId,
        coupon_id: scenario.couponId,
      },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    controller.createPayment(req, res, (error) => {
      throw error;
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(paymentService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: expectedAmount,
        coupon_id: scenario.couponId,
        tenant_id: tenant.id,
      })
    );

    expect(subscriptionService.createOrRenewSubscription).toHaveBeenCalledWith({
      user_id: 'user-1',
      plan_id: tenant.planId,
      interval: planInterval,
    });

    const subscription = subscriptionByTenant.get(tenant.id);
    expect(subscription.status).toBe('active');

    const entitlement = await entitlements.can(
      { tenantId: tenant.id, role: tenant.role, userId: 'user-1' },
      'payment.pay'
    );
    expect(entitlement.allow).toBe(true);

    expect(markCouponRedeemed).toHaveBeenCalledTimes(
      scenario.expectedRedeemCalls
    );
    expect(markCouponRedeemed).toHaveBeenCalledWith(
      scenario.couponId,
      tenant.id
    );
  };

  TEST_TENANTS.forEach((tenant) => {
    COUPON_SCENARIOS.forEach((scenario) => {
      test(`${tenant.slug}: ${scenario.name}`, async () => {
        await runScenario(tenant, scenario);
      });
    });
  });
});
