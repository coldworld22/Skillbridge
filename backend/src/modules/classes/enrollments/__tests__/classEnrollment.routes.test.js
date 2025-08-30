const request = require('supertest');
const express = require('express');

jest.mock('../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve(null));
  db.join = jest.fn(() => db);
  db.leftJoin = jest.fn(() => db);
  db.select = jest.fn(() => db);
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
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

jest.mock('../../class.service', () => ({
  getClassById: jest.fn(),
}));
const classService = require('../../class.service');

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
  hasActiveStudentSubscription: jest.fn(),
}));

const { hasActiveStudentSubscription } = require('../../../plans/subscription.helper');
const db = require('../../../../config/database');

const routes = require('../../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Class enrollment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('enroll in class', async () => {
    classService.getClassById.mockResolvedValue({
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
    classService.getClassById.mockResolvedValue({
      status: 'draft',
      moderation_status: 'Approved',
    });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('reject enrollment if class not approved', async () => {
    classService.getClassById.mockResolvedValue({
      status: 'published',
      moderation_status: 'Pending',
    });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('reject enrollment if class full', async () => {
    classService.getClassById.mockResolvedValue({
      status: 'published',
      moderation_status: 'Approved',
      max_students: 1,
    });
    service.countEnrollments.mockResolvedValue(1);
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('reject enrollment if class requires payment and user has not paid or subscribed', async () => {
    classService.getClassById.mockResolvedValue({
      status: 'published',
      moderation_status: 'Approved',
      price: 50,
    });
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue(null);
    db.first.mockResolvedValueOnce(null); // payment check
    db.first.mockResolvedValueOnce(null); // subscription check
    hasActiveStudentSubscription.mockResolvedValue(false);
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(400);
  });

  test('allow enrollment if class requires payment but user has active subscription', async () => {
    classService.getClassById.mockResolvedValue({
      status: 'published',
      moderation_status: 'Approved',
      price: 50,
    });
    service.countEnrollments.mockResolvedValue(0);
    service.findEnrollment.mockResolvedValue(null);
    db.first.mockResolvedValueOnce(null); // payment check
    hasActiveStudentSubscription.mockResolvedValue(true);
    service.createEnrollment.mockResolvedValue({ id: '1' });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(200);
    expect(service.createEnrollment).toHaveBeenCalled();
  });

  test('reactivate cancelled enrollment when capacity available', async () => {
    classService.getClassById.mockResolvedValue({
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
      expect.objectContaining({ status: 'enrolled' })
    );
    expect(service.createEnrollment).not.toHaveBeenCalled();
  });

  test('prevent re-enrollment if class full after cancellation', async () => {
    classService.getClassById.mockResolvedValue({
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
