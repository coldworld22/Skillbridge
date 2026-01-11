const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  getById: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  STATUS: { PAID: 'paid', REJECTED: 'rejected', PENDING_PAYMENT: 'pending_payment' },
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn(),
  getByType: jest.fn(),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/services/coinbaseService', () => ({
  verifyWebhook: jest.fn(),
  createCharge: jest.fn(),
}));

jest.mock('../src/modules/payments/paymentAccess', () => ({
  grantAccess: jest.fn(),
}));

jest.mock('../src/modules/payments/helpers/coupon', () => ({
  loadAndValidateCoupon: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/modules/payments/helpers/wallet', () => ({
  creditInstructorFromPayment: jest.fn(),
}));

jest.mock('../src/modules/payments/helpers/planPricing', () => ({
  ensurePlanAmountMatches: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'student-1', role: 'student', roles: ['student'] };
    next();
  },
  isStudent: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'payment-uuid'),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const methodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const paymentConfigService = require('../src/modules/paymentConfig/paymentConfig.service');
const coinbaseService = require('../src/services/coinbaseService');
const { grantAccess } = require('../src/modules/payments/paymentAccess');
const routes = require('../src/modules/payments/coinbase.routes');
const { STATUS } = require('../src/modules/payments/payments.service');

const app = express();
app.use(express.json());
app.use('/api/payments/coinbase', routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.COINBASE_API_KEY;
  delete process.env.COINBASE_APIKEY;
  delete process.env.COINBASE_KEY;
});

describe('POST /api/payments/coinbase/webhook', () => {

  it('marks payment as paid when charge confirmed', async () => {
    const payload = {
      event: {
        type: 'charge:confirmed',
        data: { id: 'ch_1', metadata: { payment_id: 'p1' } },
      },
    };
    coinbaseService.verifyWebhook.mockReturnValue(true);
    paymentsService.getById.mockResolvedValue({ id: 'p1', method_id: 'm1' });
    methodsService.getById.mockResolvedValue({ id: 'm1', settings: { webhook_secret: 'whsec' } });
    paymentsService.update.mockResolvedValue({ id: 'p1', status: STATUS.PAID });

    const res = await request(app)
      .post('/api/payments/coinbase/webhook')
      .set('X-CC-Webhook-Signature', 'sig')
      .send(payload);

    expect(res.status).toBe(200);
    expect(paymentsService.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ status: STATUS.PAID, reference_id: 'ch_1' }),
      null
    );
    expect(grantAccess).toHaveBeenCalled();
  });

  it('marks payment as rejected when charge failed', async () => {
    const payload = {
      event: {
        type: 'charge:failed',
        data: { id: 'ch_2', metadata: { payment_id: 'p2' } },
      },
    };
    coinbaseService.verifyWebhook.mockReturnValue(true);
    paymentsService.getById.mockResolvedValue({ id: 'p2', method_id: 'm1' });
    methodsService.getById.mockResolvedValue({ id: 'm1', settings: { webhook_secret: 'whsec' } });
    paymentsService.update.mockResolvedValue({ id: 'p2', status: STATUS.REJECTED });

    const res = await request(app)
      .post('/api/payments/coinbase/webhook')
      .set('X-CC-Webhook-Signature', 'sig')
      .send(payload);

    expect(res.status).toBe(200);
    expect(paymentsService.update).toHaveBeenCalledWith(
      'p2',
      expect.objectContaining({ status: STATUS.REJECTED, reference_id: 'ch_2' }),
      null
    );
  });

  it('falls back to api_secret when webhook_secret is not set', async () => {
    const payload = {
      event: {
        type: 'charge:confirmed',
        data: { id: 'ch_3', metadata: { payment_id: 'p3' } },
      },
    };
    paymentsService.getById.mockResolvedValue({ id: 'p3', method_id: 'm2' });
    methodsService.getById.mockResolvedValue({
      id: 'm2',
      settings: { api_secret: 'legacy-secret' },
    });
    coinbaseService.verifyWebhook.mockReturnValue(true);
    paymentsService.update.mockResolvedValue({ id: 'p3', status: STATUS.PAID });

    const res = await request(app)
      .post('/api/payments/coinbase/webhook')
      .set('X-CC-Webhook-Signature', 'sig')
      .send(payload);

    expect(res.status).toBe(200);
    expect(coinbaseService.verifyWebhook).toHaveBeenCalledWith(
      JSON.stringify(payload),
      'sig',
      'legacy-secret'
    );
  });
});

describe('POST /api/payments/coinbase/initiate', () => {
  beforeEach(() => {
    paymentConfigService.getSettings.mockResolvedValue({
      platformCut: { class: 10 },
    });
  });

  const basePayload = {
    item_type: 'class',
    item_id: 'cls_1',
    amount: 150,
  };

  it('accepts camelCase Coinbase API keys', async () => {
    methodsService.getByType.mockResolvedValue({
      id: 'coinbase-method',
      settings: { apiKey: 'camel-key' },
    });
    coinbaseService.createCharge.mockResolvedValue({
      data: { id: 'charge_1', hosted_url: 'https://coinbase/charge_1' },
    });
    paymentsService.create.mockResolvedValue({
      id: 'payment-uuid',
      status: STATUS.PENDING_PAYMENT,
    });

    const res = await request(app)
      .post('/api/payments/coinbase/initiate')
      .send(basePayload);

    expect(res.status).toBe(200);
    expect(coinbaseService.createCharge).toHaveBeenCalledWith(
      'camel-key',
      expect.objectContaining({
        local_price: { amount: 150, currency: 'USD' },
      })
    );
    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'payment-uuid',
        method_id: 'coinbase-method',
        reference_id: 'charge_1',
        receipt_url: 'https://coinbase/charge_1',
      }),
      expect.any(Array),
      null,
      'tenant1'
    );
  });

  it('falls back to environment API key when settings omit one', async () => {
    process.env.COINBASE_API_KEY = 'env-key';
    methodsService.getByType.mockResolvedValue({
      id: 'coinbase-method',
      settings: { currency: 'EUR' },
    });
    coinbaseService.createCharge.mockResolvedValue({
      data: { id: 'charge_2', hosted_url: 'https://coinbase/charge_2' },
    });
    paymentsService.create.mockResolvedValue({
      id: 'payment-uuid',
      status: STATUS.PENDING_PAYMENT,
    });

    const res = await request(app)
      .post('/api/payments/coinbase/initiate')
      .send(basePayload);

    expect(res.status).toBe(200);
    expect(coinbaseService.createCharge).toHaveBeenCalledWith(
      'env-key',
      expect.any(Object)
    );
    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ method_id: 'coinbase-method' }),
      expect.any(Array),
      null,
      'tenant1'
    );
  });
});
