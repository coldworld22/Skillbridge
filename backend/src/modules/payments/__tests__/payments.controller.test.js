const request = require('supertest');
const express = require('express');

const STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  AWAITING_APPROVAL: 'awaiting_approval',
  PAID: 'paid',
  REJECTED: 'rejected',
};

jest.mock('../../../utils/logger.js', () => ({
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'student-1' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
}));

jest.mock('../helpers/validation', () => ({
  validatePaymentData: jest.fn(),
}));

jest.mock('../helpers/platformFee', () => ({
  calculatePlatformFee: jest.fn(),
}));

jest.mock('../../classes/enrollments/classEnrollment.service', () => ({
  findEnrollment: jest.fn(),
  createEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
}));

jest.mock('../../users/tutorials/enrollments/tutorialEnrollment.service', () => ({
  createEnrollment: jest.fn(),
}));

jest.mock('../helpers/wallet', () => ({
  creditInstructorWallet: jest.fn(),
  creditInstructorSubscription: jest.fn(),
  creditTutorialSubscription: jest.fn(),
}));

jest.mock('../payments.service', () => ({
  STATUS,
  create: jest.fn(),
  update: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
  getByUser: jest.fn(),
}));

jest.mock('../../../services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../../users/user.model', () => ({
  findById: jest.fn(),
  findAdmins: jest.fn(),
}));

jest.mock('../../library/library.service', () => ({
  recordPurchase: jest.fn(),
}));

jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../../../services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../../coupons/coupons.service', () => ({
  incrementUsage: jest.fn(),
}));

jest.mock('../../plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

jest.mock('../../subscriptions/subscription.service', () => ({
  createOrRenewSubscription: jest.fn(),
}));

jest.mock('../../invoices/invoices.service', () => ({
  generateFromPayment: jest.fn(),
}));

jest.mock('../../paymentMethods/paymentMethods.service', () => ({
  getPaymentMethodById: jest.fn(),
}));

const { validatePaymentData } = require('../helpers/validation');
const { calculatePlatformFee } = require('../helpers/platformFee');
const enrollmentService = require('../../classes/enrollments/classEnrollment.service');
const {
  creditInstructorWallet,
  creditInstructorSubscription,
} = require('../helpers/wallet');
const service = require('../payments.service');
const AppError = require('../../../utils/AppError');
const studentRoutes = require('../student.routes');

describe('Payments controller - enrollment failures', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/payments', studentRoutes);
    app.use((err, _req, res, _next) => {
      const status = err.statusCode || 500;
      res.status(status).json({ message: err.message });
    });
  });

  test('returns error when class enrollment fails because class is full', async () => {
    validatePaymentData.mockResolvedValue({
      method: { type: 'card', id: 'method-1' },
      verifiedAmount: 100,
      verifiedCurrency: 'USD',
      finalStatus: STATUS.PAID,
      verifiedReference: 'ref-1',
      planInterval: null,
      schedules: [],
      next_due_date: null,
      totalInstallments: 1,
      subscriptionPlanId: null,
    });

    calculatePlatformFee.mockResolvedValue({
      platform_fee: 5,
      instructor_amount: 95,
    });

    service.create.mockResolvedValue({
      id: 'payment-1',
      user_id: 'student-1',
      item_type: 'class',
      item_id: 'class-1',
      status: STATUS.PAID,
      reference_id: 'ref-1',
    });

    enrollmentService.findEnrollment.mockResolvedValue(null);
    enrollmentService.createEnrollment.mockImplementation(() => {
      throw new Error('Class is full');
    });

    const response = await request(app)
      .post('/payments')
      .send({
        method_id: 'method-1',
        item_type: 'class',
        item_id: 'class-1',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ message: 'Class is full' });
    expect(enrollmentService.createEnrollment).toHaveBeenCalled();
    expect(service.update).toHaveBeenCalledWith('payment-1', {
      status: STATUS.AWAITING_APPROVAL,
      paid_at: null,
    });
    expect(creditInstructorWallet).not.toHaveBeenCalled();
  });

  test('rethrows enrollment AppError without crediting wallet', async () => {
    validatePaymentData.mockResolvedValue({
      method: { type: 'card', id: 'method-1' },
      verifiedAmount: 50,
      verifiedCurrency: 'USD',
      finalStatus: STATUS.PAID,
      verifiedReference: 'ref-2',
      planInterval: null,
      schedules: [],
      next_due_date: null,
      totalInstallments: 1,
      subscriptionPlanId: null,
    });

    calculatePlatformFee.mockResolvedValue({
      platform_fee: 2,
      instructor_amount: 48,
    });

    service.create.mockResolvedValue({
      id: 'payment-2',
      user_id: 'student-1',
      item_type: 'class',
      item_id: 'class-2',
      status: STATUS.PAID,
      reference_id: 'ref-2',
    });

    enrollmentService.findEnrollment.mockResolvedValue(null);
    enrollmentService.createEnrollment.mockImplementation(() => {
      throw new AppError('Class is full', 400);
    });

    const response = await request(app)
      .post('/payments')
      .send({
        method_id: 'method-1',
        item_type: 'class',
        item_id: 'class-2',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ message: 'Class is full' });
    expect(service.update).toHaveBeenCalledWith('payment-2', {
      status: STATUS.AWAITING_APPROVAL,
      paid_at: null,
    });
    expect(creditInstructorWallet).not.toHaveBeenCalled();
  });

  test('credits instructor subscription once for plan-covered book payment', async () => {
    validatePaymentData.mockResolvedValue({
      method: { type: 'card', id: 'method-1' },
      verifiedAmount: 0,
      verifiedCurrency: 'USD',
      finalStatus: STATUS.PAID,
      verifiedReference: 'ref-plan',
      planInterval: null,
      schedules: [],
      next_due_date: null,
      totalInstallments: 1,
      subscriptionPlanId: 'plan-1',
      subscriptionId: 'sub-1',
    });

    calculatePlatformFee.mockResolvedValue({
      platform_fee: 0,
      instructor_amount: 0,
    });

    service.create.mockResolvedValue({
      id: 'payment-plan',
      user_id: 'student-1',
      item_type: 'book',
      item_id: 'book-1',
      status: STATUS.PAID,
      reference_id: 'ref-plan',
    });

    const response = await request(app)
      .post('/payments')
      .send({
        method_id: 'method-1',
        item_type: 'book',
        item_id: 'book-1',
      });

    expect(response.statusCode).toBe(200);
    expect(creditInstructorSubscription).toHaveBeenCalledTimes(1);
    expect(creditInstructorSubscription).toHaveBeenCalledWith(
      'book',
      'book-1',
      'plan-1',
      'sub-1',
      null,
    );
  });
});
