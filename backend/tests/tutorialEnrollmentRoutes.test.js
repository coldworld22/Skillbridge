const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errorHandler');

jest.mock('../src/config/database', () => jest.fn());
const db = require('../src/config/database');

jest.mock('../src/modules/plans/subscription.helper', () => ({
  getActiveStudentPlanId: jest.fn(),
}));
const { getActiveStudentPlanId } = require('../src/modules/plans/subscription.helper');

jest.mock('../src/modules/payments/helpers/planRevenue', () => ({
  calculateInstructorAmount: jest.fn(),
}));
const planRevenue = require('../src/modules/payments/helpers/planRevenue');

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
    getActiveStudentPlanId.mockResolvedValue(null);
  });

  it('enrolls in a free tutorial', async () => {
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
    const planInsert = jest.fn(() => Promise.resolve());
    const paymentInsert = jest.fn(() => Promise.resolve());

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
      if (table === 'plan_usage_metrics')
        return {
          where: () => ({ first: () => Promise.resolve(null), update: jest.fn() }),
          insert: planInsert,
        };
      if (table === 'payments')
        return { insert: paymentInsert };
    });

    getActiveStudentPlanId.mockResolvedValue('plan1');

    const tutorialId = '123e4567-e89b-12d3-a456-426614174003';
    const res = await request(app).post(
      `/api/users/tutorials/enrollments/${tutorialId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Enrolled successfully');
    expect(planInsert).toHaveBeenCalled();
    expect(paymentInsert).toHaveBeenCalledWith({
      user_id: 'user1',
      item_id: tutorialId,
      item_type: 'tutorial',
      source: 'subscription',
      amount: 0,
    });
    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan1',
      tutorialId,
      expect.anything(),
      'tutorial'
    );
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

