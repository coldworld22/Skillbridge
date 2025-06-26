const request = require('supertest');
const express = require('express');

// Mock database to avoid connection attempts
jest.mock('../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve(null));
  db.raw = jest.fn(() => Promise.resolve());
  return db;
});

jest.mock('../class.service', () => ({
  createClass: jest.fn(),
  getAllClasses: jest.fn(),
  getClassesByInstructor: jest.fn()
}));
const service = require('../class.service');
jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));
// Mock enrollment service to avoid DB calls when routes are loaded
jest.mock('../enrollments/classEnrollment.service', () => ({
  findEnrollment: jest.fn(),
  createEnrollment: jest.fn(),
  markCompleted: jest.fn(),
  getByUser: jest.fn(),
}));
// Mock auth middleware to bypass authentication
jest.mock('../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'test-user' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const routes = require('../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Class routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('create class', async () => {
    const data = { id: '1', instructor_id: '2', title: 'Test Class', status: 'published' };
    service.createClass.mockResolvedValue(data);
    const res = await request(app).post('/classes/admin').send(data);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(data);
    expect(service.createClass).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' })
    );
  });

  test('get classes', async () => {
    const list = [{ id: '1', instructor_id: '2', title: 'Test Class' }];
    service.getAllClasses.mockResolvedValue(list);
    const res = await request(app).get('/classes/admin');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(service.getAllClasses).toHaveBeenCalled();
  });

  test('get my classes', async () => {
    const list = [{ id: '1', instructor_id: 'test-user', title: 'Mine' }];
    service.getClassesByInstructor.mockResolvedValue(list);
    const res = await request(app).get('/classes/admin/my');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(service.getClassesByInstructor).toHaveBeenCalled();
  });
});
