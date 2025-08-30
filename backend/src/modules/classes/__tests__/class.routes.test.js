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
  getClassesByInstructor: jest.fn(),
  updateClass: jest.fn(),
  togglePublishStatus: jest.fn(),
  updateModeration: jest.fn()
}));
const service = require('../class.service');
jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(() => Promise.resolve()),
}));

const notifications = require('../../notifications/notifications.service');
jest.mock('../../messages/messages.service', () => ({
  createMessage: jest.fn(() => Promise.resolve()),
}));
const messages = require('../../messages/messages.service');
jest.mock('../../users/user.model', () => ({
  findAdmins: jest.fn(() => [{ id: 'admin1' }]),
  findById: jest.fn(() => ({ id: '2', full_name: 'Test Instructor' })),
}));
const userModel = require('../../users/user.model');
// Mock enrollment service to avoid DB calls when routes are loaded
jest.mock('../enrollments/classEnrollment.service', () => ({
  findEnrollment: jest.fn(),
  createEnrollment: jest.fn(),
  markCompleted: jest.fn(),
  getByUser: jest.fn(),
}));
jest.mock('../classUploadMiddleware', () => (req, _res, next) => next());
const mockVerifyClassOwnership = jest.fn((req, _res, next) => next());
jest.mock('../../../middleware/auth/verifyClassOwnership', () => mockVerifyClassOwnership);
jest.mock('../../../middleware/validate', () => () => (req, _res, next) => next());
const mockVerifyInstructorSubscription = jest.fn((req, res, _next) =>
  res.status(403).json({ message: 'Active instructor subscription required' })
);
jest.mock('../../plans/verifyInstructorSubscription', () => mockVerifyInstructorSubscription);
// Mock auth middleware to bypass authentication
jest.mock('../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'test-user' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
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
    expect(notifications.createNotification).toHaveBeenCalledTimes(2);
    expect(messages.createMessage).toHaveBeenCalledTimes(2);
  });

  test('create class responds even if notifications fail', async () => {
    const data = { id: '3', instructor_id: '2', title: 'Fail Class', status: 'published' };
    service.createClass.mockResolvedValue(data);
    notifications.createNotification
      .mockResolvedValueOnce() // instructor notification
      .mockRejectedValueOnce(new Error('notify error')); // admin notification

    const res = await request(app).post('/classes/admin').send(data);
    expect(res.statusCode).toBe(200);
    expect(notifications.createNotification).toHaveBeenCalledTimes(2);
  });

  test('create class with options', async () => {
    const payload = {
      id: '2',
      instructor_id: '2',
      title: 'Free Class',
      status: 'published',
      price: 0,
      allow_installments: true
    };
    service.createClass.mockResolvedValue(payload);
    const res = await request(app)
      .post('/classes/admin')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(service.createClass).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'published',
        price: 0,
        allow_installments: true
      })
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

  test('toggle class status', async () => {
    const updated = { id: '1', status: 'published', moderation_status: 'Pending' };
    service.togglePublishStatus.mockResolvedValue(updated);
    const res = await request(app).patch('/classes/admin/1/status');
    expect(res.statusCode).toBe(200);
    expect(service.togglePublishStatus).toHaveBeenCalledWith('1');
    expect(res.body.data).toEqual(updated);
  });

  test('approve class', async () => {
    const approved = { id: '1', status: 'published', moderation_status: 'Approved' };
    service.updateModeration.mockResolvedValue(approved);
    const res = await request(app).patch('/classes/admin/1/approve');
    expect(res.statusCode).toBe(200);
    expect(service.updateModeration).toHaveBeenCalledWith('1', 'Approved');
    expect(res.body.data).toEqual(approved);
  });

  test('instructor update blocked without active plan', async () => {
    const res = await request(app)
      .put('/classes/instructor/1')
      .send({ title: 'Update' });
    expect(res.statusCode).toBe(403);
    expect(mockVerifyInstructorSubscription).toHaveBeenCalled();
    expect(service.updateClass).not.toHaveBeenCalled();
  });

  test('instructor publish blocked without active plan', async () => {
    const res = await request(app).patch('/classes/instructor/1/status');
    expect(res.statusCode).toBe(403);
    expect(mockVerifyInstructorSubscription).toHaveBeenCalled();
    expect(service.togglePublishStatus).not.toHaveBeenCalled();
  });
});
