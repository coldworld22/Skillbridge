const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
  STATUS: { PAID: 'paid', PENDING_PAYMENT: 'pending_payment' },
  findInstallmentContext: jest.fn(),
}));

jest.mock('../src/modules/payments/paymentSchedule.service', () => ({
  markPaid: jest.fn(),
  markAwaitingPayment: jest.fn(),
}));

const dbMock = () => {
  const builder = {
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
  };
  return builder;
};

const mockDbInstance = jest.fn(dbMock);
mockDbInstance.fn = { now: jest.fn(() => new Date()) };

jest.mock('../src/config/database', () => mockDbInstance);

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn().mockResolvedValue({ id: 'm1', type: 'card', active: true }),
}));

jest.mock('../src/services/paypalService', () => ({
  captureOrder: jest.fn(),
}));

jest.mock('../src/modules/classes/class.service', () => ({
  getClassById: jest.fn().mockImplementation((id) => {
    if (id === 'c1') {
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      return Promise.resolve({
        id,
        price: 20,
        allow_installments: true,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      });
    }
    return Promise.resolve(null);
  }),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'admin1' }; next(); },
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/services/smsService', () => ({ sendSMS: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn().mockResolvedValue({}) }));
jest.mock('../src/modules/library/library.service', () => ({ recordPurchase: jest.fn() }));
jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({
  findEnrollment: jest.fn().mockResolvedValue(null),
  createEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
}));
jest.mock('../src/modules/users/tutorials/enrollments/tutorialEnrollment.service', () => ({
  findEnrollment: jest.fn().mockResolvedValue(null),
  createEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
}));
jest.mock('../src/modules/notifications/notifications.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/services/mailService', () => ({ sendMail: jest.fn() }));
jest.mock('../src/modules/coupons/coupons.service', () => ({
  getCouponById: jest.fn(),
  incrementUsage: jest.fn(),
}));

const service = require('../src/modules/payments/payments.service');
const enrollmentService = require('../src/modules/classes/enrollments/classEnrollment.service');
const scheduleService = require('../src/modules/payments/paymentSchedule.service');
const routes = require('../src/modules/payments/payments.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/admin', routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/payments/admin', () => {
  beforeEach(() => {
    service.create.mockReset();
    service.findInstallmentContext.mockReset();
    scheduleService.markPaid.mockReset();
    mockDbInstance.mockClear();
    mockDbInstance.fn.now.mockClear();
    service.findInstallmentContext.mockResolvedValue({ payment: null, schedule: null });
  });

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
    expect(args[0].installments).toBe(2);
    expect(args[1]).toHaveLength(1);
    expect(args[1][0].installment_number).toBe(2);
    expect(enrollmentService.createEnrollment).toHaveBeenCalled();
  });

  it('records a follow-up installment and settles the pending schedule', async () => {
    const outstanding = {
      payment: { id: 'parent1', installments: 2 },
      schedule: {
        id: 'sched1',
        installment_number: 2,
        amount: 10,
        payment_id: 'parent1',
      },
    };
    service.findInstallmentContext.mockResolvedValue(outstanding);
    service.create.mockResolvedValue({ id: 'p2', status: 'paid' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'c1',
      amount: 10,
      allow_installments: true,
      installments: 2,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    const args = service.create.mock.calls[0];
    expect(args[0].installments).toBe(2);
    expect(args[0].installment_number).toBe(2);
    expect(args).toHaveLength(1); // no new schedules created
    expect(scheduleService.markPaid).toHaveBeenCalledWith('sched1');
    const updateCalls = mockDbInstance.mock.results
      .map((result) => result.value)
      .filter((builder) => typeof builder.update === 'function')
      .flatMap((builder) => builder.update.mock.calls);
    expect(updateCalls.some((call) => call[0]?.next_due_date === null)).toBe(true);
  });
});
