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
  db.onConflict = jest.fn(() => db);
  db.merge = jest.fn(() => db);
  db.returning = jest.fn(() => Promise.resolve([{}]));
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
  getActiveStudentSubscription: jest.fn(),
}));

jest.mock('../../../payments/helpers/planPayments', () => ({
  recordPlanCoveredPayment: jest.fn(),
}));

jest.mock('../../class.controller', () => ({
  createClass: jest.fn(),
  getAllClasses: jest.fn(),
  getMyClasses: jest.fn(),
  getClassById: jest.fn(),
  getManagementData: jest.fn(),
  getClassAnalytics: jest.fn(),
  toggleClassStatus: jest.fn(),
  approveClass: jest.fn(),
  rejectClass: jest.fn(),
  deleteClass: jest.fn(),
  bulkDeleteClasses: jest.fn(),
  updateClass: jest.fn(),
  getPublishedClasses: jest.fn(),
  getPublicClassDetails: jest.fn(),
}));
jest.mock('../../classTag.controller', () => ({
  listTags: jest.fn(),
  createTag: jest.fn(),
}));
jest.mock('../../class.validator', () => ({}));
jest.mock('../../classUploadMiddleware', () => (_req, _res, next) => next());
jest.mock('../../../../middleware/validate', () => () => (_req, _res, next) => next());
jest.mock('../../../../middleware/auth/verifyClassOwnership', () => (_req, _res, next) => next());

jest.mock('../../../payments/helpers/planRevenue', () => ({
  calculateInstructorAmount: jest.fn(),
}));

jest.mock('../../../payouts/wallet.service', () => ({
  increment: jest.fn(),
}));

jest.mock('../../class.service', () => ({
  getClassById: jest.fn(),
}));

jest.mock('../../../../utils/logger.js', () => ({
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const {
  getActiveStudentPlanId,
  getActiveStudentSubscription,
} = require('../../../plans/subscription.helper');
const { calculateInstructorAmount } = require('../../../payments/helpers/planRevenue');
const walletService = require('../../../payouts/wallet.service');
const classService = require('../../class.service');
const { recordPlanCoveredPayment } = require('../../../payments/helpers/planPayments');
const db = require('../../../../config/database');
const routes = require('../../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Class enrollment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    calculateInstructorAmount.mockReset();
    walletService.increment.mockReset();
    classService.getClassById.mockReset();
    recordPlanCoveredPayment.mockReset();
    getActiveStudentSubscription.mockReset();
    getActiveStudentPlanId.mockReset();
    db.first.mockReset();
    db.first.mockImplementation(() => Promise.resolve(null));
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
    getActiveStudentSubscription.mockResolvedValue(null);
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
        currency: 'USD',
      })
      .mockResolvedValueOnce(null);
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue(null);
    service.createEnrollment.mockResolvedValue({ id: 'enrollment-id' });
    getActiveStudentSubscription.mockResolvedValue({
      id: 'sub1',
      plan_id: 'plan1',
    });
    calculateInstructorAmount.mockResolvedValue(0);
    recordPlanCoveredPayment.mockResolvedValue({ id: 'payment-id' });

    const res = await request(app).post('/classes/enroll/abc');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Enrolled successfully');
    expect(service.createEnrollment).toHaveBeenCalled();
    expect(recordPlanCoveredPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        trx: expect.any(Function),
        userId: 'test-user',
        itemId: 'abc',
        itemType: 'class',
        amount: 0,
        currency: 'USD',
      }),
    );
    expect(calculateInstructorAmount).toHaveBeenCalledWith(
      'plan1',
      'sub1',
      'abc',
      expect.any(Function),
      'class'
    );
    expect(walletService.increment).not.toHaveBeenCalled();
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
    getActiveStudentSubscription.mockResolvedValue({
      id: 'sub1',
      plan_id: 'plan1',
    });
    const res = await request(app).post('/classes/enroll/abc');
    expect(db.first).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(400);
  });

  test('reactivate cancelled enrollment when capacity available', async () => {
    const trx = jest.fn(() => trx);
    trx.where = jest.fn(() => trx);
    trx.whereNot = jest.fn(() => trx);
    trx.forUpdate = jest.fn(() => trx);
    trx.insert = jest.fn(() => trx);
    trx.update = jest.fn(() => trx);
    trx.first = jest
      .fn()
      .mockResolvedValueOnce({
        status: 'published',
        moderation_status: 'Approved',
        max_students: 1,
      })
      .mockResolvedValue(null);
    db.transaction.mockImplementationOnce(async (fn) => fn(trx));
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue({
      user_id: 'test-user',
      class_id: 'abc',
      status: 'cancelled',
    });
    service.updateEnrollment.mockResolvedValue(1);
    const res = await request(app).post('/classes/enroll/abc');
    expect(trx.first).toHaveBeenCalledTimes(1);
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
    const trx = jest.fn(() => trx);
    trx.where = jest.fn(() => trx);
    trx.whereNot = jest.fn(() => trx);
    trx.forUpdate = jest.fn(() => trx);
    trx.insert = jest.fn(() => trx);
    trx.update = jest.fn(() => trx);
    trx.first = jest
      .fn()
      .mockResolvedValueOnce({
        status: 'published',
        moderation_status: 'Approved',
        max_students: 1,
      })
      .mockResolvedValue(null);
    db.transaction.mockImplementationOnce(async (fn) => fn(trx));
    service.countEnrollments.mockResolvedValue(1);
    service.findEnrollment.mockResolvedValue({
      user_id: 'test-user',
      class_id: 'abc',
      status: 'cancelled',
    });
    const res = await request(app).post('/classes/enroll/abc');
    expect(trx.first).toHaveBeenCalledTimes(1);
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
