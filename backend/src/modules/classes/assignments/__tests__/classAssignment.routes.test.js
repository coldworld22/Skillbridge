const request = require('supertest');
const express = require('express');

jest.mock('../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve(null));
  db.select = jest.fn(() => db);
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
  return db;
});

jest.mock('../classAssignment.service', () => ({
  getByClass: jest.fn(),
  getAllAssignments: jest.fn(),
  getAssignmentWithClass: jest.fn(),
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
}));
const service = require('../classAssignment.service');

jest.mock('../submission.service', () => ({
  getSubmissionForUser: jest.fn(),
}));
const submissionService = require('../submission.service');

jest.mock('../../class.service', () => ({
  getClassById: jest.fn(() => Promise.resolve({ id: 'c1', title: 'Class' })),
}));

jest.mock('../../enrollments/classEnrollment.service', () => ({
  getByClass: jest.fn(() =>
    Promise.resolve([
      { id: 's1', email: 's1@test.com', phone: '111' },
      { id: 's2', email: 's2@test.com', phone: '222' },
    ])
  ),
  findEnrollment: jest.fn(() =>
    Promise.resolve({
      status: 'active',
    })
  ),
}));

jest.mock('../../../notifications/notifications.service', () => ({
  createNotification: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../../../../utils/email', () => ({
  sendAssignmentEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../services/smsService', () => ({
  sendSMS: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'test-user' }; next(); },
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
}));
jest.mock('../../../../middleware/auth/verifyEnrollment', () => (_req, _res, next) => next());
jest.mock('../../../../middleware/auth/verifyClassOwnership', () => (_req, _res, next) => next());
jest.mock('../../../../middleware/auth/verifyAssignmentOwnership', () => (_req, _res, next) => next());

const routes = require('../../class.routes');
const emailUtil = require('../../../../utils/email');
const smsService = require('../../../../services/smsService');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Class assignment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    submissionService.getSubmissionForUser.mockResolvedValue(null);
  });

  test('get assignments by class', async () => {
    const list = [{ id: '1' }];
    service.getByClass.mockResolvedValue(list);
    const res = await request(app).get('/classes/assignments/class/abc');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
  });

  test('get assignment by id', async () => {
    service.getAssignmentWithClass.mockResolvedValue({
      id: 'a1',
      title: 'Assignment',
      class_id: 'class-1',
      class_title: 'Class',
      instructor_id: 'instructor-1',
    });
    const res = await request(app).get('/classes/assignments/a1');
    expect(res.statusCode).toBe(200);
    expect(service.getAssignmentWithClass).toHaveBeenCalledWith('a1');
    expect(res.body.data.assignment.id).toBe('a1');
  });

  test('get all assignments', async () => {
    const list = [{ id: '1' }];
    service.getAllAssignments.mockResolvedValue(list);
    const res = await request(app).get('/classes/assignments/admin');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
  });

  test('create assignment sends messages', async () => {
    service.createAssignment.mockResolvedValue({ id: '1', title: 'New', due_date: '2024-01-01' });
    const res = await request(app)
      .post('/classes/assignments/class/abc')
      .send({ title: 'New', due_date: '2024-01-01' });
    expect(res.statusCode).toBe(200);
    expect(service.createAssignment).toHaveBeenCalled();
    expect(emailUtil.sendAssignmentEmail).toHaveBeenCalledTimes(2);
    expect(smsService.sendSMS).toHaveBeenCalledTimes(2);
  });

  test('create assignment fails with invalid date', async () => {
    const res = await request(app)
      .post('/classes/assignments/class/abc')
      .send({ title: 'New', due_date: 'not-a-date' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Validation error');
    expect(service.createAssignment).not.toHaveBeenCalled();
  });

  test('create assignment fails with missing title', async () => {
    const res = await request(app)
      .post('/classes/assignments/class/abc')
      .send({ due_date: '2024-01-01' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Validation error');
    expect(service.createAssignment).not.toHaveBeenCalled();
  });

  test('update assignment', async () => {
    service.updateAssignment.mockResolvedValue({ id: '1' });
    const res = await request(app)
      .put('/classes/assignments/1')
      .send({ title: 'Edit' });
    expect(res.statusCode).toBe(200);
    expect(service.updateAssignment).toHaveBeenCalled();
  });

  test('delete assignment', async () => {
    service.deleteAssignment.mockResolvedValue();
    const res = await request(app).delete('/classes/assignments/1');
    expect(res.statusCode).toBe(200);
    expect(service.deleteAssignment).toHaveBeenCalled();
  });
});
