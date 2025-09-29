const originalBackendUrl = process.env.BACKEND_URL;
const originalFrontendUrl = process.env.FRONTEND_URL;
const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;
process.env.BACKEND_URL = 'https://api.test/backend/';
process.env.FRONTEND_URL = 'https://frontend.test';
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://user:pass@localhost:5432/test_db';

const request = require('supertest');
const express = require('express');

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'payment-123'),
}));

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
  STATUS: { PENDING_PAYMENT: 'PENDING_PAYMENT', PAID: 'PAID', REJECTED: 'REJECTED' },
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getByType: jest.fn(),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/services/nowPaymentsService', () => ({
  createInvoice: jest.fn(),
}));

jest.mock('../src/modules/plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'u1' }; next(); },
  isStudent: (_req, _res, next) => next(),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const methodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const configService = require('../src/modules/paymentConfig/paymentConfig.service');
const nowPayments = require('../src/services/nowPaymentsService');
const plansService = require('../src/modules/plans/plans.service');
const routes = require('../src/modules/payments/crypto.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/crypto', routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/payments/crypto/initiate', () => {
  it('creates invoice and stores payment for plan', async () => {
    methodsService.getByType.mockResolvedValue({
      id: 'm3',
      settings: { api_key: 'k', currency: 'USDT', ipn_secret: 'secret' },
    });
    configService.getSettings.mockResolvedValue({ platformCut: { plan: 5 } });
    nowPayments.createInvoice.mockResolvedValue({ id: 1, invoice_url: 'https://crypto.test/invoice' });
    plansService.getPlanById.mockResolvedValue({ id: 'plan1', price_monthly: 100, price_yearly: 200 });
    paymentsService.create.mockResolvedValue({ id: 'p1' });

    const res = await request(app)
      .post('/api/payments/crypto/initiate')
      .send({ item_type: 'plan', item_id: 'plan1', amount: 100 });

    expect(res.status).toBe(200);
    expect(plansService.getPlanById).toHaveBeenCalledWith('plan1');
    expect(res.body.data.invoice_url).toBe('https://crypto.test/invoice');
    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ item_type: 'plan', item_id: 'plan1', amount: 100 })
    );
    const [, invoicePayload] = nowPayments.createInvoice.mock.calls[0];
    expect(invoicePayload).toMatchObject({
      order_id: 'payment-123',
      ipn_callback_url: 'https://api.test/backend/api/payments/crypto/ipn',
      success_url: 'https://frontend.test/payments/success',
      cancel_url: 'https://frontend.test/payments/error',
    });
  });
});

afterAll(() => {
  if (originalBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = originalBackendUrl;
  }
  if (originalFrontendUrl === undefined) {
    delete process.env.FRONTEND_URL;
  } else {
    process.env.FRONTEND_URL = originalFrontendUrl;
  }
  if (originalTestDatabaseUrl === undefined) {
    delete process.env.TEST_DATABASE_URL;
  } else {
    process.env.TEST_DATABASE_URL = originalTestDatabaseUrl;
  }
});
