const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/services/smsService', () => ({ sendSMS: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn().mockResolvedValue({}) }));
jest.mock('../src/modules/library/library.service', () => ({ recordPurchase: jest.fn() }));
jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({ createEnrollment: jest.fn() }));

const service = require('../src/modules/payments/payments.service');
const enrollmentService = require('../src/modules/classes/enrollments/classEnrollment.service');
const routes = require('../src/modules/payments/payments.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/admin', routes);

describe('POST /api/payments/admin', () => {
  it('creates payment with installments and enrolls', async () => {
    service.create.mockResolvedValue({ id: 'p1', status: 'paid' });
    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'c1',
      amount: 10,
      allow_installments: true,
      installments: 3,
      status: 'paid',
    });
    expect(res.status).toBe(200);
    const args = service.create.mock.calls[0];
    expect(args[0].installments).toBe(3);
    expect(args[1]).toHaveLength(2);
    expect(enrollmentService.createEnrollment).toHaveBeenCalled();
  });
});
