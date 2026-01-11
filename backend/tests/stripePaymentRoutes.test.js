const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  STATUS: { PAID: 'paid', PENDING_PAYMENT: 'pending_payment', AWAITING_APPROVAL: 'awaiting_approval', REJECTED: 'rejected' },
  create: jest.fn(),
}));

jest.mock('../src/services/stripeService', () => ({
  charge: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn(),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/classes/class.service', () => ({
  getClassById: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({ sendSMS: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/library/library.service', () => ({ recordPurchase: jest.fn() }));
jest.mock('../src/modules/notifications/notifications.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/services/mailService', () => ({ sendMail: jest.fn() }));
jest.mock('../src/modules/coupons/coupons.service', () => ({ getCouponById: jest.fn(), incrementUsage: jest.fn() }));
jest.mock('../src/modules/plans/plans.service', () => ({ getPlanById: jest.fn() }));
jest.mock('../src/modules/subscriptions/subscription.service', () => ({ createOrRenewSubscription: jest.fn() }));
jest.mock('../src/modules/payouts/wallet.service', () => ({ increment: jest.fn() }));
jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({ getTutorialById: jest.fn() }));
jest.mock('../src/modules/books/book.service', () => ({ getBookById: jest.fn() }));
jest.mock('../src/modules/invoices/invoices.service', () => ({ generateFromPayment: jest.fn() }));
jest.mock('../src/modules/payments/paymentAccess', () => ({ grantAccess: jest.fn() }));
jest.mock('../src/modules/payments/helpers/enrollment', () => ({ handleEnrollment: jest.fn() }));
jest.mock('../src/modules/payments/helpers/wallet', () => ({ creditInstructorWallet: jest.fn() }));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'u1' }; next(); },
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const stripeService = require('../src/services/stripeService');
const methodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const configService = require('../src/modules/paymentConfig/paymentConfig.service');
const classService = require('../src/modules/classes/class.service');
const routes = require('../src/modules/payments/stripe.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/stripe', routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/payments/stripe/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configService.getSettings.mockResolvedValue({ platformCut: { class: 15 } });
    methodsService.getById.mockResolvedValue({ id: 'm1', type: 'stripe', active: true });
    classService.getClassById.mockResolvedValue({ id: 'c1', price: 100 });
  });

  it('creates payment when Stripe charge succeeds', async () => {
    stripeService.charge.mockResolvedValue({ id: 'ch_1', status: 'succeeded', amount: 10000, currency: 'usd' });
    paymentsService.create.mockResolvedValue({ id: 'p1', status: 'paid', reference_id: 'ch_1' });

    const res = await request(app)
      .post('/api/payments/stripe/create')
      .send({ method_id: 'm1', item_type: 'class', item_id: 'c1', amount: 100, token: 'tok_123' });

    expect(res.status).toBe(200);
    expect(stripeService.charge).toHaveBeenCalledWith({ token: 'tok_123', amount: 100, currency: 'USD' });
    expect(paymentsService.create).toHaveBeenCalled();
  });

  it('returns error when Stripe charge fails', async () => {
    stripeService.charge.mockRejectedValue(new Error('Card declined'));

    const res = await request(app)
      .post('/api/payments/stripe/create')
      .send({ method_id: 'm1', item_type: 'class', item_id: 'c1', amount: 100, token: 'tok_bad' });

    expect(res.status).toBe(400);
    expect(paymentsService.create).not.toHaveBeenCalled();
  });
});
