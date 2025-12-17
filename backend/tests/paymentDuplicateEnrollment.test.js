const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
  update: jest.fn(),
  STATUS: {
    PAID: 'paid',
    PENDING_PAYMENT: 'pending_payment',
    AWAITING_APPROVAL: 'awaiting_approval',
  },
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn().mockResolvedValue({ id: 'm1', type: 'card', active: true }),
}));

jest.mock('../src/services/smsService', () => ({ sendSMS: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn().mockResolvedValue({}) }));
jest.mock('../src/modules/library/library.service', () => ({ recordPurchase: jest.fn() }));

jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({
  findEnrollment: jest.fn(),
  createEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
  countEnrollments: jest.fn(),
}));
jest.mock('../src/modules/classes/class.service', () => ({
  getClassById: jest.fn(),
}));
jest.mock('../src/modules/users/tutorials/enrollments/tutorialEnrollment.service', () => ({
  findEnrollment: jest.fn(),
  createEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
}));
jest.mock('../src/modules/notifications/notifications.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/services/mailService', () => ({ sendMail: jest.fn() }));
jest.mock('../src/modules/coupons/coupons.service', () => ({
  getCouponById: jest.fn(),
  incrementUsage: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => { _req.user = { id: 'u1' }; next(); },
  isAdmin: (_req, _res, next) => next(),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const enrollmentService = require('../src/modules/classes/enrollments/classEnrollment.service');
const classService = require('../src/modules/classes/class.service');
const routes = require('../src/modules/payments/payments.routes');
const { grantAccess } = require('../src/modules/payments/paymentAccess');

const app = express();
app.use(express.json());
app.use('/api/payments/admin', routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('duplicate enrollment prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates existing class enrollment instead of creating new one', async () => {
    paymentsService.create.mockResolvedValue({ id: 'p1', status: 'paid' });
    classService.getClassById.mockResolvedValue({});
    enrollmentService.countEnrollments.mockResolvedValue(0);
    enrollmentService.findEnrollment.mockResolvedValue({ user_id: 'u1', class_id: 'c1', status: 'pending' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'c1',
      amount: 100,
      status: 'paid',
    });
    expect(res.status).toBe(200);
    expect(enrollmentService.findEnrollment).toHaveBeenCalledWith('u1', 'c1');
    expect(enrollmentService.createEnrollment).not.toHaveBeenCalled();
    expect(enrollmentService.updateEnrollment).toHaveBeenCalledWith('u1', 'c1', { status: 'enrolled' });
  });

  it('skips creation when enrollment already enrolled in grantAccess', async () => {
    classService.getClassById.mockResolvedValue({});
    enrollmentService.countEnrollments.mockResolvedValue(0);
    enrollmentService.findEnrollment.mockResolvedValue({ user_id: 'u1', class_id: 'c1', status: 'enrolled' });

    await grantAccess({ item_type: 'class', item_id: 'c1', user_id: 'u1', amount: 100 });
    expect(enrollmentService.findEnrollment).toHaveBeenCalledWith('u1', 'c1');
    expect(enrollmentService.createEnrollment).not.toHaveBeenCalled();
    expect(enrollmentService.updateEnrollment).not.toHaveBeenCalled();
  });

  it('flags payment when class is full', async () => {
    classService.getClassById.mockResolvedValue({ max_students: 1 });
    enrollmentService.countEnrollments.mockResolvedValue(1);

    await grantAccess({ id: 'p1', item_type: 'class', item_id: 'c1', user_id: 'u1', amount: 100 });

    expect(enrollmentService.findEnrollment).not.toHaveBeenCalled();
    expect(enrollmentService.createEnrollment).not.toHaveBeenCalled();
    expect(enrollmentService.updateEnrollment).not.toHaveBeenCalled();
    expect(paymentsService.update).toHaveBeenCalledWith('p1', { status: 'awaiting_approval' });
  });
});
