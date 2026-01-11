const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  getByUser: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn(),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/coupons/coupons.service', () => ({
  getCouponById: jest.fn(),
  incrementUsage: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findById: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
  isStudent: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant-1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const service = require('../src/modules/payments/payments.service');
const methodService = require('../src/modules/paymentMethods/paymentMethods.service');
const configService = require('../src/modules/paymentConfig/paymentConfig.service');
const couponService = require('../src/modules/coupons/coupons.service');
const routes = require('../src/modules/payments/student.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/student', routes);

describe('GET /api/payments/student', () => {
  it('returns student payments', async () => {
    const mock = [{ id: 'p1' }];
    service.getByUser.mockResolvedValue(mock);

    const res = await request(app).get('/api/payments/student');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getByUser).toHaveBeenCalledWith('user1', {}, 'tenant-1');
  });
});

describe('GET /api/payments/student/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a payment for the authenticated user', async () => {
    const payment = { id: 'p1', user_id: 'user1' };
    service.getById.mockResolvedValue(payment);

    const res = await request(app).get('/api/payments/student/p1');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payment);
    expect(service.getById).toHaveBeenCalledWith('p1', 'tenant-1');
  });

  it('returns 404 when payment belongs to another user', async () => {
    service.getById.mockResolvedValue({ id: 'p1', user_id: 'other' });

    const res = await request(app).get('/api/payments/student/p1');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/payments/student', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a payment using authenticated user id', async () => {
    methodService.getById.mockResolvedValue({ id: 'm1', type: 'card', active: true });
    configService.getSettings.mockResolvedValue({ platformCut: {} });
    service.create.mockResolvedValue({ id: 'p1', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/student').send({
      user_id: 'other',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'i1',
      amount: 100,
    });

    expect(res.status).toBe(200);
    const call = service.create.mock.calls[0][0];
    expect(call.user_id).toBe('user1');
  });

  it('rejects inactive payment methods', async () => {
    methodService.getById.mockResolvedValue({ id: 'm1', type: 'card', active: false });
    configService.getSettings.mockResolvedValue({ platformCut: {} });

    const res = await request(app).post('/api/payments/student').send({
      method_id: 'm1',
      item_type: 'class',
      item_id: 'i1',
      amount: 100,
    });

    expect(res.status).toBe(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('rejects invalid coupon', async () => {
    methodService.getById.mockResolvedValue({ id: 'm1', type: 'card', active: true });
    configService.getSettings.mockResolvedValue({ platformCut: {} });
    couponService.getCouponById.mockResolvedValue(null);

    const res = await request(app).post('/api/payments/student').send({
      method_id: 'm1',
      item_type: 'class',
      item_id: 'i1',
      amount: 100,
      coupon_id: 'bad',
    });

    expect(res.status).toBe(400);
    expect(service.create).not.toHaveBeenCalled();
  });
});
