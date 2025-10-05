const request = require('supertest');
const express = require('express');

jest.mock('../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.whereNot = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve(null));
  db.join = jest.fn(() => db);
  db.leftJoin = jest.fn(() => db);
  db.select = jest.fn(() => db);
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
  db.forUpdate = jest.fn(() => db);
  db.transaction = jest.fn(async (fn) => fn(db));
  return db;
});

jest.mock('../classEnrollment.service', () => ({
  findEnrollment: jest.fn(),
  createEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
  countEnrollments: jest.fn(),
  markCompleted: jest.fn(),
  getByUser: jest.fn(),
  getByClass: jest.fn(),
  getStudent: jest.fn(),
}));
const service = require('../classEnrollment.service');

jest.mock('../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'test-user' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
}));

jest.mock('../../../plans/subscription.helper', () => ({
  getActiveStudentPlanId: jest.fn(),
}));

jest.mock('../../../payments/helpers/planRevenue', () => {
  let usageCount = 0;
  const calculateInstructorAmount = jest.fn(async (_planId, _itemId, trx) => {
    usageCount += 1;
    await trx('plan_usage_metrics').update({
      usage_count: usageCount,
      instructor_amount: 5,
    });
    return 5;
  });
  calculateInstructorAmount.resetUsage = () => {
    usageCount = 0;
  };
  calculateInstructorAmount.getUsageCount = () => usageCount;
  return { calculateInstructorAmount };
});

jest.mock('../../../payments/helpers/wallet', () => {
  const creditInstructorSubscription = jest.fn(
    async (_type, _id, _planId, _trx, delta) => {
      if (delta > 0) {
        creditInstructorSubscription.walletCredits =
          (creditInstructorSubscription.walletCredits || 0) + 1;
      }
    },
  );
  creditInstructorSubscription.resetCredits = () => {
    creditInstructorSubscription.walletCredits = 0;
  };
  creditInstructorSubscription.getCredits = () =>
    creditInstructorSubscription.walletCredits || 0;
  return { creditInstructorSubscription };
});

jest.mock('../../../payments/helpers/planPayments', () => ({
  recordPlanCoveredPayment: jest.fn(),
}));

jest.mock('../../../../utils/logger.js', () => ({
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { getActiveStudentPlanId } = require('../../../plans/subscription.helper');
const planRevenue = require('../../../payments/helpers/planRevenue');
const { creditInstructorSubscription } = require('../../../payments/helpers/wallet');
const { recordPlanCoveredPayment } = require('../../../payments/helpers/planPayments');
const logger = require('../../../../utils/logger.js');
const db = require('../../../../config/database');
const routes = require('../../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Class enrollment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.first.mockReset();
    db.first.mockImplementation(() => Promise.resolve(null));
    db.transaction.mockImplementation(async (fn) => fn(db));
    planRevenue.calculateInstructorAmount.resetUsage();
    creditInstructorSubscription.resetCredits();
    db.update.mockClear();
  });

  test('enroll in class', async () => {
    db.first.mockResolvedValueOnce({
      status: 'published',
      moderation_status: 'Approved',
    });
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue(null);
    service.createEnrollment.mockResolvedValue({ id: '1' });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(200);
    expect(service.createEnrollment).toHaveBeenCalled();
  });

  test('reject enrollment if class not published', async () => {
    db.first.mockResolvedValueOnce({
      status: 'draft',
      moderation_status: 'Approved',
    });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('reject enrollment if class not approved', async () => {
    db.first.mockResolvedValueOnce({
      status: 'published',
      moderation_status: 'Pending',
    });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('reject enrollment if class full', async () => {
    db.first.mockResolvedValueOnce({
      status: 'published',
      moderation_status: 'Approved',
      max_students: 1,
    });
    service.countEnrollments.mockResolvedValue(1);
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('reject enrollment if class requires payment and user has not paid or subscribed', async () => {
    db.first
      .mockResolvedValueOnce({
        status: 'published',
        moderation_status: 'Approved',
        price: 50,
      })
      .mockResolvedValueOnce(null); // payment check
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue(null);
    getActiveStudentPlanId.mockResolvedValue(null);
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('allow enrollment when class covered by subscription', async () => {
    db.first
      .mockResolvedValueOnce({
        status: 'published',
        moderation_status: 'Approved',
        price: 50,
        included_plans: ['plan1'],
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'plan1', price_monthly: 0 });
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue(null);
    getActiveStudentPlanId.mockResolvedValue('plan1');
    service.createEnrollment.mockResolvedValue({ id: '1' });
    recordPlanCoveredPayment.mockResolvedValue({ id: 'payment-id' });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(200);
    expect(service.createEnrollment).toHaveBeenCalled();
    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledTimes(1);
    expect(creditInstructorSubscription).toHaveBeenCalledTimes(1);
    expect(creditInstructorSubscription).toHaveBeenCalledWith(
      'class',
      'abc',
      'plan1',
      expect.anything(),
      5,
    );
    expect(planRevenue.calculateInstructorAmount.getUsageCount()).toBe(1);
    const usageUpdates = db.update.mock.calls.filter(([data]) =>
      data && Object.prototype.hasOwnProperty.call(data, 'usage_count'),
    );
    expect(usageUpdates).toHaveLength(1);
    expect(usageUpdates[0][0].usage_count).toBe(1);
    expect(creditInstructorSubscription.getCredits()).toBe(1);
    expect(recordPlanCoveredPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        trx: db,
        userId: 'test-user',
        itemId: 'abc',
        itemType: 'class',
        amount: 0,
        currency: 'USD',
      }),
    );
  });

  test('reject enrollment when subscription active but class not covered', async () => {
    db.first.mockImplementationOnce(() =>
      Promise.resolve({
        status: 'published',
        moderation_status: 'Approved',
        price: 50,
        included_plans: ['plan2'],
      }),
    );
    db.first.mockImplementationOnce(() => Promise.resolve(null)); // payment check
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue(null);
    getActiveStudentPlanId.mockResolvedValue('plan1');
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('reactivate cancelled enrollment when capacity available', async () => {
    db.first.mockResolvedValueOnce({
      status: 'published',
      moderation_status: 'Approved',
      max_students: 1,
    });
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue({
      user_id: 'test-user',
      class_id: 'abc',
      status: 'cancelled',
    });
    service.updateEnrollment.mockResolvedValue(1);
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(200);
    expect(service.updateEnrollment).toHaveBeenCalledWith(
      'test-user',
      'abc',
      expect.objectContaining({ status: 'enrolled' }),
      expect.anything()
    );
    expect(service.createEnrollment).not.toHaveBeenCalled();
  });

  test('prevent re-enrollment if class full after cancellation', async () => {
    db.first.mockResolvedValueOnce({
      status: 'published',
      moderation_status: 'Approved',
      max_students: 1,
    });
    service.countEnrollments.mockResolvedValue(1);
    service.findEnrollment.mockResolvedValue({
      user_id: 'test-user',
      class_id: 'abc',
      status: 'cancelled',
    });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
    expect(service.updateEnrollment).not.toHaveBeenCalled();
  });

  test('get my enrollments', async () => {
    const list = [{ id: '1' }];
    service.getByUser.mockResolvedValue(list);
    const res = await request(app).get('/classes/enroll/my');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
  });

  test('list students in class', async () => {
    const list = [{ id: 'stu' }];
    service.getByClass.mockResolvedValue(list);
    const res = await request(app).get('/classes/admin/abc/students');
    expect(res.statusCode).toBe(200);
    expect(service.getByClass).toHaveBeenCalledWith('abc');
    expect(res.body.data).toEqual(list);
  });

  test('get student details', async () => {
    const student = { id: 'stu' };
    service.getStudent.mockResolvedValue(student);
    const res = await request(app).get('/classes/admin/abc/students/def');
    expect(res.statusCode).toBe(200);
    expect(service.getStudent).toHaveBeenCalledWith('abc', 'def');
    expect(res.body.data).toEqual(student);
  });
});
