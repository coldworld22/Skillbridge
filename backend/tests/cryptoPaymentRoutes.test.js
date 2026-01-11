const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
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

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
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
    methodsService.getByType.mockResolvedValue({ id: 'm3', settings: { api_key: 'k', currency: 'USDT' } });
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
      expect.objectContaining({ item_type: 'plan', item_id: 'plan1', amount: 100 }),
      expect.any(Array),
      null,
      'tenant1'
    );
  });
});
