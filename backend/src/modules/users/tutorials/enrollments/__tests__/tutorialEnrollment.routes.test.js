const request = require('supertest');
const express = require('express');

jest.mock('../../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve(null));
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
  db.transaction = jest.fn(async (fn) => fn(db));
  db.count = jest.fn(() => Promise.resolve([{ count: 0 }]));
  db.andWhere = jest.fn(() => db);
  db.join = jest.fn(() => db);
  return db;
});

jest.mock('../../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'student-1' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../../../../plans/subscription.helper', () => ({
  getActiveStudentPlanId: jest.fn(),
  getActiveStudentSubscription: jest.fn(),
}));

jest.mock('../../../../payments/helpers/planRevenue', () => ({
  calculateInstructorAmount: jest.fn(() => Promise.resolve(0)),
}));

jest.mock('../../../../payments/helpers/planPayments', () => ({
  recordPlanCoveredPayment: jest.fn(),
}));

const db = require('../../../../../config/database');
const {
  getActiveStudentPlanId,
  getActiveStudentSubscription,
} = require('../../../../plans/subscription.helper');
const { recordPlanCoveredPayment } = require('../../../../payments/helpers/planPayments');

const routes = require('../../tutorial.routes');

const app = express();
app.use(express.json());
app.use('/tutorials', routes);

describe('Tutorial enrollment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveStudentSubscription.mockResolvedValue(null);
  });

  test('enrolls tutorial via subscription without payment method requirement', async () => {
    const tutorial = {
      status: 'published',
      moderation_status: 'Approved',
      price: 25,
      included_plans: ['plan-1'],
    };

    db.first
      .mockResolvedValueOnce(tutorial)
      .mockResolvedValueOnce(null);
    getActiveStudentSubscription.mockResolvedValue({
      id: 'sub-1',
      plan_id: 'plan-1',
    });
    recordPlanCoveredPayment.mockResolvedValue({ id: 'payment-id' });

    const res = await request(app).post('/tutorials/enroll/abc-tutorial');

    expect(res.statusCode).toBe(200);
    expect(recordPlanCoveredPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        trx: expect.any(Function),
        userId: 'student-1',
        itemId: 'abc-tutorial',
        itemType: 'tutorial',
        source: 'subscription',
      }),
    );
    expect(recordPlanCoveredPayment).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        user_id: 'student-1',
        tutorial_id: 'abc-tutorial',
        status: 'enrolled',
      }),
    );
  });
});
