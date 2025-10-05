jest.mock('../../../utils/catchAsync', () => (fn) => fn);
jest.mock('../../paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));
jest.mock('../../paymentMethods/paymentMethods.service', () => ({
  getByType: jest.fn(),
  getById: jest.fn(),
}));
jest.mock('../../../services/nowPaymentsService', () => ({
  createInvoice: jest.fn(),
  verifyIpnSignature: jest.fn(),
}));
jest.mock('../../../services/paypalService', () => ({
  createOrder: jest.fn(),
  captureOrder: jest.fn(),
}));
jest.mock('../payments.service', () => ({
  STATUS: {
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
    REJECTED: 'rejected',
  },
  create: jest.fn(),
  update: jest.fn(),
  getById: jest.fn(),
}));
jest.mock('../paymentAccess', () => ({
  grantAccess: jest.fn(),
}));
jest.mock('../../plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));
jest.mock('../../coupons/coupons.service', () => ({
  getCouponById: jest.fn(),
}));
jest.mock('../../../utils/response', () => ({
  sendSuccess: jest.fn(),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'payment-123'),
}));
jest.mock('../../../config/backendUrl', () => ({
  requireBackendBaseUrl: jest.fn(),
  getBackendBaseUrlError: jest.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

const setBaseEnv = (overrides = {}) => {
  process.env = {
    ...ORIGINAL_ENV,
    NODE_ENV: 'test',
    JWT_SECRET: 'test-jwt',
    REFRESH_TOKEN_SECRET: 'test-refresh',
    SESSION_SECRET: 'test-session',
    TEST_DATABASE_URL: 'postgres://user:pass@localhost:5432/testdb',
    BACKEND_PORT: '5002',
    FRONTEND_URL: 'https://frontend.example.com',
    ...overrides,
  };
};

describe('payment controller URLs', () => {
  let cryptoController;
  let paypalController;
  let nowPaymentsService;
  let paypalService;
  let paymentMethodsService;
  let paymentsService;
  let backendUrl;
  let plansService;
  let couponService;

  beforeEach(() => {
    jest.resetModules();
    setBaseEnv({ BACKEND_URL: 'https://api.example.com/base/' });

    nowPaymentsService = require('../../../services/nowPaymentsService');
    paypalService = require('../../../services/paypalService');
    paymentMethodsService = require('../../paymentMethods/paymentMethods.service');
    paymentsService = require('../payments.service');
    plansService = require('../../plans/plans.service');
    couponService = require('../../coupons/coupons.service');
    backendUrl = require('../../../config/backendUrl');
    backendUrl.requireBackendBaseUrl.mockReturnValue('https://api.example.com/base');
    backendUrl.getBackendBaseUrlError.mockReturnValue(undefined);
    paymentsService.create.mockResolvedValue({ id: 'payment-123', status: 'pending_payment' });
    nowPaymentsService.createInvoice.mockResolvedValue({
      id: 'invoice-1',
      invoice_url: 'https://payments.example.com/invoice',
    });
    paypalService.createOrder.mockResolvedValue({
      id: 'order-1',
      links: [{ rel: 'approve', href: 'https://paypal.example.com/approve' }],
    });

    paymentMethodsService.getByType.mockResolvedValue({
      id: 'method-1',
      settings: {
        api_key: 'secret',
        ipn_secret: 'ipn-secret',
        currency: 'USDT',
      },
    });

    cryptoController = require('../crypto.controller');
    paypalController = require('../paypal.controller');
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.clearAllMocks();
  });

  const createResponseMock = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  it('builds the crypto IPN callback URL from the backend base URL', async () => {
    const req = {
      body: {
        item_type: 'class',
        item_id: 'item-1',
        amount: 25,
        currency: 'USD',
        method_type: 'crypto',
      },
      user: { id: 'user-1' },
    };

    await cryptoController.initiateCryptoPayment(req, createResponseMock());

    expect(nowPaymentsService.createInvoice).toHaveBeenCalledWith(
      'secret',
      expect.objectContaining({
        ipn_callback_url: 'https://api.example.com/base/api/payments/crypto/ipn',
      }),
    );
  });

  it('builds the PayPal return URL from the backend base URL', async () => {
    const req = {
      body: {
        item_type: 'class',
        item_id: 'item-1',
        amount: 15,
        currency: 'USD',
      },
      user: { id: 'user-1' },
    };

    await paypalController.createPayPalPayment(req, createResponseMock());

    expect(paypalService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        returnUrl: 'https://api.example.com/base/api/payments/paypal/callback?payment_id=payment-123',
      }),
    );
  });

  it('throws an error when backend base URL cannot be resolved', async () => {
    backendUrl.requireBackendBaseUrl.mockImplementation(() => {
      throw new Error('missing base');
    });
    backendUrl.getBackendBaseUrlError.mockReturnValue('missing base');

    const req = {
      body: {
        item_type: 'class',
        item_id: 'item-1',
        amount: 25,
        currency: 'USD',
        method_type: 'crypto',
      },
      user: { id: 'user-1' },
    };

    await expect(cryptoController.initiateCryptoPayment(req, createResponseMock())).rejects.toThrow(
      'Backend base URL is not configured',
    );
  });

  it('accepts discounted plan payments for PayPal using coupons', async () => {
    plansService.getPlanById.mockResolvedValue({
      id: 'plan-1',
      price_monthly: '100.00',
      price_yearly: '1000.00',
    });
    couponService.getCouponById.mockResolvedValue({
      id: 'coupon-1',
      discount_percent: 10,
      applies_to: 'plan',
      applies_to_id: null,
      starts_at: null,
      expires_at: null,
      usage_limit: null,
      times_used: 0,
    });

    const req = {
      body: {
        item_type: 'plan',
        item_id: 'plan-1',
        amount: 90,
        coupon_id: 'coupon-1',
      },
      user: { id: 'user-1' },
    };

    await paypalController.createPayPalPayment(req, createResponseMock());

    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 90 }),
    );
  });

  it('accepts discounted plan payments for crypto using coupons', async () => {
    plansService.getPlanById.mockResolvedValue({
      id: 'plan-1',
      price_monthly: '50.00',
      price_yearly: '500.00',
    });
    couponService.getCouponById.mockResolvedValue({
      id: 'coupon-1',
      discount_percent: 20,
      applies_to: 'plan',
      applies_to_id: null,
      starts_at: null,
      expires_at: null,
      usage_limit: null,
      times_used: 0,
    });

    const req = {
      body: {
        item_type: 'plan',
        item_id: 'plan-1',
        amount: 40,
        method_type: 'crypto',
        coupon_id: 'coupon-1',
      },
      user: { id: 'user-1' },
    };

    await cryptoController.initiateCryptoPayment(req, createResponseMock());

    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 40 }),
    );
  });
});
