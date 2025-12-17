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

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'u1' }; next(); },
  isStudent: (_req, _res, next) => next(),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const methodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const configService = require('../src/modules/paymentConfig/paymentConfig.service');
const routes = require('../src/modules/payments/bank.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/bank', routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/payments/bank/initiate', () => {
  it('falls back to default cut when config missing item type', async () => {
    methodsService.getByType.mockResolvedValue({ id: 'm1', settings: {} });
    configService.getSettings.mockResolvedValue({ platformCut: {} });
    paymentsService.create.mockResolvedValue({ id: 'p1' });

    const res = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'tutorial', item_id: 't1', amount: 200 });

    expect(res.status).toBe(200);
    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 40, instructor_amount: 160 })
    );
  });

  it('rejects negative amount', async () => {
    const res = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'tutorial', item_id: 't1', amount: -5 });
    expect(res.status).toBe(400);
  });

  it('rejects invalid item type', async () => {
    const res = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'course', item_id: 't1', amount: 100 });
    expect(res.status).toBe(400);
  });

  it('rejects unsupported currency', async () => {
    const res = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'tutorial', item_id: 't1', amount: 100, currency: 'XYZ' });
    expect(res.status).toBe(400);
  });
});
