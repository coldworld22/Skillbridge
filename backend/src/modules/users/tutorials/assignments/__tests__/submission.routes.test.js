const request = require('supertest');
const express = require('express');

jest.mock('../../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve(null));
  db.select = jest.fn(() => db);
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
  return db;
});

jest.mock('../submission.service', () => ({
  getMySubmission: jest.fn(),
  getSubmissionById: jest.fn(),
  createSubmission: jest.fn(),
  updateSubmission: jest.fn(),
}));
const service = require('../submission.service');

jest.mock('../tutorialAssignment.service', () => ({
  getById: jest.fn(() => Promise.resolve({ id: 'a1', tutorial_id: 't1' })),
}));
const assignmentService = require('../tutorialAssignment.service');

jest.mock('../../enrollments/tutorialEnrollment.service', () => ({
  findEnrollment: jest.fn(() => Promise.resolve({ status: 'active' })),
  recalculateProgress: jest.fn(() => Promise.resolve(50)),
}));
const enrollmentService = require('../../enrollments/tutorialEnrollment.service');

jest.mock('../../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'test-user' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
}));

const routes = require('../../tutorial.routes');

const app = express();
app.use(express.json());
app.use('/api/users/tutorials', routes);

describe('Tutorial assignment submission routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getMySubmission.mockResolvedValue(null);
    service.getSubmissionById.mockResolvedValue({
      id: '1',
      assignment_id: 'a1',
      user_id: 'test-user',
    });
  });

  test('get my submission', async () => {
    const submission = { id: '1' };
    service.getMySubmission.mockResolvedValue(submission);
    const res = await request(app).get(
      '/api/users/tutorials/assignments/submissions/assignment/a1'
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(submission);
  });

  test('create submission triggers progress', async () => {
    service.createSubmission.mockResolvedValue({ id: '1', assignment_id: 'a1' });
    const res = await request(app)
      .post('/api/users/tutorials/assignments/submissions/assignment/a1')
      .send({ file_url: 'url' });
    expect(res.statusCode).toBe(200);
    expect(service.createSubmission).toHaveBeenCalled();
    expect(assignmentService.getById).toHaveBeenCalledWith('a1');
    expect(enrollmentService.recalculateProgress).toHaveBeenCalledWith(
      'test-user',
      't1'
    );
  });

  test('update submission triggers progress', async () => {
    service.updateSubmission.mockResolvedValue({ id: '1', assignment_id: 'a1' });
    const res = await request(app)
      .put('/api/users/tutorials/assignments/submissions/1')
      .send({ text_answer: 'Updated answer' });
    expect(res.statusCode).toBe(200);
    expect(service.updateSubmission).toHaveBeenCalledWith('1', {
      text_answer: 'Updated answer',
    });
    expect(service.getSubmissionById).toHaveBeenCalledWith('1');
    expect(enrollmentService.recalculateProgress).toHaveBeenCalled();
  });
});
