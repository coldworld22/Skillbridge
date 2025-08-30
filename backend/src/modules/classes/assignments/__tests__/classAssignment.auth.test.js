const request = require('supertest');
const express = require('express');

let mockClassInstructorId = 'owner';
let mockAssignmentInstructorId = 'owner';
let mockEnrolled = false;

jest.mock('../../../../config/database', () => {
  return jest.fn((table) => {
    if (table.startsWith('online_classes')) {
      const query = {};
      query.select = () => query;
      query.where = () => query;
      query.first = () => Promise.resolve({ instructor_id: mockClassInstructorId });
      return query;
    }
    if (table === 'class_enrollments') {
      const query = {};
      query.where = () => query;
      query.first = () => Promise.resolve(mockEnrolled ? { id: 'e1' } : null);
      return query;
    }
    if (table.startsWith('class_assignments')) {
      const query = {};
      query.join = () => query;
      query.select = () => query;
      query.where = () => query;
      query.first = () => Promise.resolve({ instructor_id: mockAssignmentInstructorId });
      return query;
    }
    return {};
  });
});

jest.mock('../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1', roles: ['instructor'] }; next(); },
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const routes = require('../classAssignment.routes');

const app = express();
app.use(express.json());
app.use('/assignments', routes);

describe('class assignment authorization', () => {
  beforeEach(() => {
    mockClassInstructorId = 'owner';
    mockAssignmentInstructorId = 'owner';
    mockEnrolled = false;
  });

  test('rejects non-enrolled user from fetching assignments', async () => {
    mockClassInstructorId = 'other';
    const res = await request(app).get('/assignments/class/cls1');
    expect(res.status).toBe(403);
  });

  test('rejects non-owner from creating assignment', async () => {
    mockClassInstructorId = 'other';
    const res = await request(app)
      .post('/assignments/class/cls1')
      .send({ title: 'A', due_date: '2024-01-01' });
    expect(res.status).toBe(403);
  });

  test('rejects non-owner from updating assignment', async () => {
    mockAssignmentInstructorId = 'other';
    const res = await request(app)
      .put('/assignments/assign1')
      .send({ title: 'B' });
    expect(res.status).toBe(403);
  });

  test('rejects non-owner from deleting assignment', async () => {
    mockAssignmentInstructorId = 'other';
    const res = await request(app).delete('/assignments/assign1');
    expect(res.status).toBe(403);
  });
});
