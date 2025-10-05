process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://localhost/test-db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const express = require('express');

let mockCurrentUser;

jest.mock('../src/config/database', () => jest.fn());

jest.mock('../src/modules/classes/enrollments/classEnrollment.routes', () => require('express').Router());
jest.mock('../src/modules/classes/lessons/classLesson.routes', () => require('express').Router());
jest.mock('../src/modules/classes/assignments/submission.routes', () => require('express').Router());
jest.mock('../src/modules/classes/assignments/classAssignment.routes', () => require('express').Router());
jest.mock('../src/modules/classes/wishlist/classWishlist.routes', () => require('express').Router());
jest.mock('../src/modules/classes/likes/classLike.routes', () => require('express').Router());
jest.mock('../src/modules/classes/notifications/classNotification.routes', () => require('express').Router());
jest.mock('../src/modules/classes/attendance/classAttendance.routes', () => require('express').Router());
jest.mock('../src/modules/classes/reviews/classReview.routes', () => require('express').Router());
jest.mock('../src/modules/classes/comments/classComment.routes', () => require('express').Router());
jest.mock('../src/modules/classes/scores/classScore.routes', () => require('express').Router());
jest.mock('../src/modules/classes/rules/classRule.routes', () => require('express').Router());

jest.mock('../src/modules/classes/classTag.service', () => ({}));
jest.mock('../src/modules/notifications/notifications.service', () => ({}));
jest.mock('../src/modules/messages/messages.service', () => ({}));
jest.mock('../src/modules/users/user.model', () => ({}));
jest.mock('../src/modules/plans/plans.service', () => ({}));
jest.mock('../src/modules/plans/instructor.helper', () => ({
  getActiveInstructorPlan: jest.fn(),
}));

jest.mock('../src/modules/classes/class.service', () => ({
  getClassesByInstructor: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = mockCurrentUser;
    next();
  },
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
}));

const service = require('../src/modules/classes/class.service');
const routes = require('../src/modules/classes/class.routes');

const app = express();
app.use(express.json());
app.use('/api/users/classes', routes);

describe('GET /api/users/classes/instructor/my', () => {
  beforeEach(() => {
    mockCurrentUser = undefined;
    service.getClassesByInstructor.mockReset();
  });

  it('returns only the authenticated instructor classes even when override is requested', async () => {
    mockCurrentUser = { id: 'instructor-1', role: 'instructor', roles: ['instructor'] };
    service.getClassesByInstructor.mockResolvedValue({ data: [], meta: { total: 0 } });

    const res = await request(app)
      .get('/api/users/classes/instructor/my?instructorId=instructor-2');

    expect(res.status).toBe(200);
    expect(service.getClassesByInstructor).toHaveBeenCalledWith('instructor-1', {
      page: 1,
      limit: 10,
    });
  });
});

describe('GET /api/users/classes/admin/my', () => {
  beforeEach(() => {
    mockCurrentUser = undefined;
    service.getClassesByInstructor.mockReset();
  });

  it('allows admin users to request classes for any instructor', async () => {
    mockCurrentUser = { id: 'admin-1', role: 'admin', roles: ['admin'] };
    service.getClassesByInstructor.mockResolvedValue({ data: [], meta: { total: 0 } });

    const res = await request(app)
      .get('/api/users/classes/admin/my?instructorId=instructor-2');

    expect(res.status).toBe(200);
    expect(service.getClassesByInstructor).toHaveBeenCalledWith('instructor-2', {
      page: 1,
      limit: 10,
    });
  });
});
