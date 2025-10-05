const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errorHandler');

jest.mock('../src/config/database', () => jest.fn());
const db = require('../src/config/database');

jest.mock('../src/modules/plans/subscription.helper', () => ({
  getActiveStudentPlanId: jest.fn(),
  getActiveStudentSubscription: jest.fn(),
}));
const {
  getActiveStudentPlanId,
  getActiveStudentSubscription,
} = require('../src/modules/plans/subscription.helper');

jest.mock('../src/modules/payments/helpers/wallet', () => ({
  creditInstructorSubscription: jest.fn(),
  creditTutorialSubscription: jest.fn(),
}));
jest.mock('../src/modules/payments/helpers/methods.js', () => ({
  getPlanCoveredMethod: jest.fn(),
}));
jest.mock('../src/modules/payments/helpers/planRevenue', () => ({
  calculateInstructorAmount: jest.fn(),
}));
jest.mock('../src/modules/payments/helpers/planPayments', () => ({
  recordPlanCoveredPayment: jest.fn(),
}));
const planRevenue = require('../src/modules/payments/helpers/planRevenue');
const { getPlanCoveredMethod } = require('../src/modules/payments/helpers/methods.js');
const { recordPlanCoveredPayment } = require('../src/modules/payments/helpers/planPayments');

jest.mock('../src/modules/payments/helpers/wallet', () => ({
  creditTutorialSubscription: jest.fn(),
}));
const { creditTutorialSubscription } = require('../src/modules/payments/helpers/wallet');

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'user1' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
}));

const routes = require('../src/modules/users/tutorials/enrollments/tutorialEnrollment.routes');

const app = express();
app.use(express.json());
app.use('/api/users/tutorials/enrollments', routes);
app.use(errorHandler);

describe('POST /api/users/tutorials/enrollments/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveStudentSubscription.mockResolvedValue(null);
    planRevenue.calculateInstructorAmount.mockResolvedValue(0);
    recordPlanCoveredPayment.mockResolvedValue({ id: 'payment-id' });
    creditTutorialSubscription.mockResolvedValue();
  });

  it('enrolls in a free tutorial', async () => {
    const tutorialId = '123e4567-e89b-12d3-a456-426614174003';

    const paymentMethodWhere = jest.fn(() => ({
      first: () => Promise.resolve({ id: 'plan-method-1' }),
    }));
    const paymentMethodInsert = jest.fn(() =>
      Promise.resolve([{ id: 'plan-method-1' }]),
    );

    db.mockImplementation((table) => {
      if (table === 'tutorials')
        return {
          where: () => ({
            first: () =>
              Promise.resolve({
                id: 't1',
                price: 0,
                moderation_status: 'Approved',
                status: 'published',
              }),
          }),
        };
      if (table === 'tutorial_enrollments')
        return {
          where: () => ({ first: () => Promise.resolve(null) }),
          insert: jest.fn(() => Promise.resolve()),
        };
    });

    const res = await request(app).post(
      '/api/users/tutorials/enrollments/123e4567-e89b-12d3-a456-426614174000',
    );
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Enrolled successfully');
  });

  it('returns error when payment missing for paid tutorial', async () => {
    db.mockImplementation((table) => {
      if (table === 'tutorials')
        return {
          where: () => ({
            first: () =>
              Promise.resolve({
                id: 't2',
                price: 100,
                moderation_status: 'Approved',
                status: 'published',
              }),
          }),
        };
      if (table === 'tutorial_enrollments')
        return {
          where: () => ({ first: () => Promise.resolve(null) }),
          insert: jest.fn(() => Promise.resolve()),
        };
      if (table === 'payments')
        return {
          where: () => ({ first: () => Promise.resolve(null) }),
        };
    });

    const res = await request(app).post(
      '/api/users/tutorials/enrollments/123e4567-e89b-12d3-a456-426614174001',
    );
    expect(res.status).toBe(402);
    expect(res.body.message).toBe('Payment required');
  });

  it('enrolls in paid tutorial with existing payment', async () => {
    db.mockImplementation((table) => {
      if (table === 'tutorials')
        return {
          where: () => ({
            first: () =>
              Promise.resolve({
                id: 't3',
                price: 50,
                moderation_status: 'Approved',
                status: 'published',
              }),
          }),
        };
      if (table === 'tutorial_enrollments')
        return {
          where: () => ({ first: () => Promise.resolve(null) }),
          insert: jest.fn(() => Promise.resolve()),
        };
      if (table === 'payments')
        return {
          where: () =>
            ({ first: () => Promise.resolve({ status: 'paid', installments: 1 }) }),
        };
    });

    const res = await request(app).post(
      '/api/users/tutorials/enrollments/123e4567-e89b-12d3-a456-426614174002',
    );
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Enrolled successfully');
  });

  it('enrolls in paid tutorial covered by subscription', async () => {
    const calculatedAmount = 42;
    const tutorialId = '123e4567-e89b-12d3-a456-426614174003';

    const paymentMethodWhere = jest.fn(() => ({
      first: () => Promise.resolve({ id: 'plan-method-1' }),
    }));
    const paymentMethodInsert = jest.fn(() =>
      Promise.resolve([{ id: 'plan-method-1' }]),
    );

    db.mockImplementation((table) => {
      if (table === 'tutorials')
        return {
          where: () => ({
            first: () =>
              Promise.resolve({
                id: 't4',
                price: 100,
                moderation_status: 'Approved',
                status: 'published',
                included_plans: ['plan1'],
              }),
          }),
        };
      if (table === 'tutorial_enrollments')
        return {
          where: () => ({ first: () => Promise.resolve(null) }),
          insert: jest.fn(() => Promise.resolve()),
        };
      if (table === 'payments')
        return {
          insert: jest.fn(async () => [
            {
              id: 'payment-sub',
              user_id: 'user1',
              item_id: tutorialId,
              status: 'paid',
            },
          ]),
        };
      if (table === 'payment_methods_config')
        return { where: paymentMethodWhere, insert: paymentMethodInsert };
    });

    getActiveStudentSubscription.mockResolvedValue({
      id: 'sub1',
      plan_id: 'plan1',
    });
    planRevenue.calculateInstructorAmount.mockResolvedValue(calculatedAmount);
    let instructorWalletBalance = 0;
    getPlanCoveredMethod.mockResolvedValue({ id: 'plan-method-1' });
    creditTutorialSubscription.mockImplementation(
      async (tutorial, planId, subscriptionId, trx) => {
        const amount = await planRevenue.calculateInstructorAmount(
          planId,
          subscriptionId,
          tutorial,
          trx,
          'tutorial',
        );
        instructorWalletBalance += amount;
      },
    );

    const res = await request(app).post(
      `/api/users/tutorials/enrollments/${tutorialId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Enrolled successfully');
    expect(recordPlanCoveredPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user1',
        itemId: tutorialId,
        itemType: 'tutorial',
        source: 'subscription',
      })
    );
    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan1',
      'sub1',
      tutorialId,
      expect.anything(),
      'tutorial'
    );
    expect(creditTutorialSubscription).toHaveBeenCalledWith(
      tutorialId,
      'plan1',
      'sub1',
      expect.anything(),
    );
    expect(creditTutorialSubscription).toHaveBeenCalledTimes(1);
    expect(instructorWalletBalance).toBe(calculatedAmount);
  });
});

describe('POST /api/users/tutorials/enrollments/:id/complete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks tutorial as completed and sets progress to 100', async () => {
    const update = jest.fn(() => Promise.resolve());

    db.mockImplementation((table) => {
      if (table === 'tutorial_enrollments')
        return {
          where: () => ({ first: () => Promise.resolve({ id: 'e1' }), update }),
        };
      if (table === 'tutorial_chapters')
        return {
          where: () => ({ count: () => Promise.resolve([{ count: 1 }]) }),
        };
      if (table === 'tutorial_chapter_completions as tcc')
        return {
          join: () => ({
            where: () => ({
              andWhere: () => ({ count: () => Promise.resolve([{ count: 1 }]) }),
            }),
          }),
        };
      if (table === 'tutorial_quizzes')
        return { where: () => ({ first: () => Promise.resolve(null) }) };
      if (table === 'tutorial_assignments')
        return { where: () => ({ count: () => Promise.resolve([{ count: 0 }]) }) };
      if (table === 'tutorial_assignment_submissions as tas')
        return {
          join: () => ({
            where: () => ({
              andWhere: () => ({ count: () => Promise.resolve([{ count: 0 }]) }),
            }),
          }),
        };
    });

    const res = await request(app).post(
      '/api/users/tutorials/enrollments/123e4567-e89b-12d3-a456-426614174000/complete',
    );
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: 'completed', progress: 100 });
  });

  it('fails when assignments are not submitted', async () => {
    db.mockImplementation((table) => {
      if (table === 'tutorial_enrollments')
        return {
          where: () => ({ first: () => Promise.resolve({ id: 'e1' }) }),
        };
      if (table === 'tutorial_chapters')
        return { where: () => ({ count: () => Promise.resolve([{ count: 0 }]) }) };
      if (table === 'tutorial_chapter_completions as tcc')
        return {
          join: () => ({
            where: () => ({
              andWhere: () => ({ count: () => Promise.resolve([{ count: 0 }]) }),
            }),
          }),
        };
      if (table === 'tutorial_quizzes')
        return { where: () => ({ first: () => Promise.resolve(null) }) };
      if (table === 'tutorial_assignments')
        return { where: () => ({ count: () => Promise.resolve([{ count: 1 }]) }) };
      if (table === 'tutorial_assignment_submissions as tas')
        return {
          join: () => ({
            where: () => ({
              andWhere: () => ({ count: () => Promise.resolve([{ count: 0 }]) }),
            }),
          }),
        };
    });

    const res = await request(app).post(
      '/api/users/tutorials/enrollments/123e4567-e89b-12d3-a456-426614174000/complete',
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/users/tutorials/enrollments/status/batch', () => {
  it('returns enrollment status map for provided tutorials', async () => {
    db.mockImplementation((table) => {
      if (table === 'tutorial_enrollments')
        return {
          where: () => ({
            whereIn: () =>
              Promise.resolve([
                {
                  tutorial_id: '123e4567-e89b-12d3-a456-426614174100',
                  status: 'completed',
                  progress: null,
                },
                {
                  tutorial_id: '123e4567-e89b-12d3-a456-426614174101',
                  status: 'enrolled',
                  progress: 40,
                },
              ]),
          }),
        };
    });

    const res = await request(app)
      .post('/api/users/tutorials/enrollments/status/batch')
      .send({
        tutorialIds: [
          '123e4567-e89b-12d3-a456-426614174100',
          '123e4567-e89b-12d3-a456-426614174101',
          '123e4567-e89b-12d3-a456-426614174102',
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      '123e4567-e89b-12d3-a456-426614174100': {
        enrolled: true,
        status: 'completed',
        progress: 100,
      },
      '123e4567-e89b-12d3-a456-426614174101': {
        enrolled: true,
        status: 'enrolled',
        progress: 40,
      },
      '123e4567-e89b-12d3-a456-426614174102': {
        enrolled: false,
        status: null,
        progress: 0,
      },
    });
  });
});

