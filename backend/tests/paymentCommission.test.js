const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getByUser: jest.fn(),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn().mockResolvedValue({ type: 'card', active: true }),
}));

jest.mock('../src/services/paypalService', () => ({
  captureOrder: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findById: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/modules/library/library.service', () => ({
  recordPurchase: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'admin1' }; next(); },
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/payments/payments.service');
const configService = require('../src/modules/paymentConfig/paymentConfig.service');
const routes = require('../src/modules/payments/payments.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/admin', routes);

describe('payment commission calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates commission for class payments', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { class: 10 } });
    service.create.mockResolvedValue({ id: 'p1', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'i1',
      amount: 100,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 10, instructor_amount: 90 })
    );
  });

  it('calculates commission for book payments', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { book: 20 } });
    service.create.mockResolvedValue({ id: 'p2', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'book',
      item_id: 'i2',
      amount: 50,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 10, instructor_amount: 40 })
    );
  });

  it('calculates commission for tutorial payments', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { tutorial: 30 } });
    service.create.mockResolvedValue({ id: 'p3', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'tutorial',
      item_id: 'i3',
      amount: 200,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 60, instructor_amount: 140 })
    );
  });

  it('falls back to default cut when settings missing', async () => {
    configService.getSettings.mockResolvedValue(null);
    service.create.mockResolvedValue({ id: 'p4', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'i4',
      amount: 100,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 15, instructor_amount: 85 })
    );
  });
});
