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
  markCompleted: jest.fn(),
  getByUser: jest.fn(),
  getByClass: jest.fn(),
  getStudent: jest.fn()
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
}));

const routes = require('../../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Class enrollment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('enroll in class', async () => {
    service.findEnrollment.mockResolvedValue(null);
    service.createEnrollment.mockResolvedValue({ id: '1' });
    const res = await request(app).post('/classes/enroll/abc');
    expect(res.statusCode).toBe(200);
    expect(service.createEnrollment).toHaveBeenCalled();
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
