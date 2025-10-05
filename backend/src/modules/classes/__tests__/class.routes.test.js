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
  getPublishedClasses: jest.fn(),
  getClassById: jest.fn(),
  updateClass: jest.fn(),
  togglePublishStatus: jest.fn(),
  updateModeration: jest.fn(),
  countPublishedClasses: jest.fn(),
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
// Mock auth middleware to bypass authentication
jest.mock('../../../middleware/auth/authMiddleware', () => {
  const mockUser = { id: 'test-user', role: 'instructor', roles: ['instructor'] };
  return {
    verifyToken: (req, _res, next) => {
      req.user = { ...mockUser };
      next();
    },
    isStudent: (_req, _res, next) => next(),
    isInstructorOrAdmin: (_req, _res, next) => next(),
    isAdmin: (_req, _res, next) => next(),
    isInstructor: (_req, _res, next) => next(),
    setMockUser: (user) => {
      Object.keys(mockUser).forEach((key) => delete mockUser[key]);
      Object.assign(mockUser, user);
    },
  };
});

const routes = require('../class.routes');
jest.mock('../../plans/instructor.helper', () => ({
  getActiveInstructorPlan: jest.fn(),
}));
const { getActiveInstructorPlan } = require('../../plans/instructor.helper');
jest.mock('../../plans/plans.service', () => ({ getPlanById: jest.fn() }));
const planService = require('../../plans/plans.service');

const authMiddleware = require('../../../middleware/auth/authMiddleware');

const app = express();
app.use(express.json());
app.use('/classes', routes);
app.use((err, _req, res, _next) => {
  res.status(err.statusCode || 500).json({ message: err.message });
});

describe('Class routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMiddleware.setMockUser({ id: 'test-user', role: 'instructor', roles: ['instructor'] });
    getActiveInstructorPlan.mockResolvedValue({ id: 'plan1', max_courses: 10 });
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      features: [{ feature_key: 'classes_create', value: 'true' }],
    });
    service.countPublishedClasses.mockResolvedValue(0);
    service.getClassById.mockResolvedValue({ id: '1', status: 'draft', instructor_id: 'test-user', title: 'Old' });
  });

  test.skip('create class', async () => {
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

  test.skip('create class responds even if notifications fail', async () => {
    const data = { id: '3', instructor_id: '2', title: 'Fail Class', status: 'published' };
    service.createClass.mockResolvedValue(data);
    notifications.createNotification
      .mockResolvedValueOnce() // instructor notification
      .mockRejectedValueOnce(new Error('notify error')); // admin notification

    const res = await request(app).post('/classes/admin').send(data);
    expect(res.statusCode).toBe(200);
    expect(notifications.createNotification).toHaveBeenCalledTimes(2);
  });

  test.skip('create class with options', async () => {
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
    const result = { data: list, meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    service.getAllClasses.mockResolvedValue(result);
    const res = await request(app).get('/classes/admin?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(res.body.meta).toEqual(result.meta);
    expect(service.getAllClasses).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  test('get my classes', async () => {
    const list = [{ id: '1', instructor_id: 'test-user', title: 'Mine' }];
    const result = { data: list, meta: { page: 1, limit: 5, total: 1, totalPages: 1 } };
    service.getClassesByInstructor.mockResolvedValue(result);
    const res = await request(app).get('/classes/admin/my?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(res.body.meta).toEqual(result.meta);
    expect(service.getClassesByInstructor).toHaveBeenCalledWith('test-user', { page: 1, limit: 5 });
  });

  test('instructor cannot override instructorId when fetching my classes', async () => {
    const result = {
      data: [{ id: '1', instructor_id: 'test-user', title: 'Mine' }],
      meta: { page: 2, limit: 10, total: 1, totalPages: 1 },
    };
    service.getClassesByInstructor.mockResolvedValue(result);

    const res = await request(app).get('/classes/instructor/my?page=2&instructorId=other-user');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(result.data);
    expect(service.getClassesByInstructor).toHaveBeenCalledWith('test-user', { page: 2, limit: 10 });
  });

  test('admin can override instructorId when fetching classes', async () => {
    authMiddleware.setMockUser({ id: 'admin-user', role: 'admin', roles: ['admin'] });
    const result = {
      data: [{ id: '1', instructor_id: 'target-instructor', title: 'Managed' }],
      meta: { page: 3, limit: 5, total: 1, totalPages: 1 },
    };
    service.getClassesByInstructor.mockResolvedValue(result);

    const res = await request(app).get('/classes/admin/my?page=3&limit=5&instructorId=target-instructor');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(result.data);
    expect(service.getClassesByInstructor).toHaveBeenCalledWith('target-instructor', { page: 3, limit: 5 });
  });

  test('get published classes', async () => {
    const list = [{ id: '1', title: 'Pub', status: 'published' }];
    const result = { data: list, meta: { page: 2, limit: 1, total: 1, totalPages: 1 } };
    service.getPublishedClasses.mockResolvedValue(result);
    const res = await request(app).get('/classes?page=2&limit=1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(res.body.meta).toEqual(result.meta);
    expect(service.getPublishedClasses).toHaveBeenCalledWith({ page: 2, limit: 1 });
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

  test('instructor can create class within plan limit', async () => {
    const data = {
      id: '1',
      instructor_id: 'test-user',
      title: 'Test Class',
      access_type: 'free',
    };
    service.createClass.mockResolvedValue(data);
    const res = await request(app)
      .post('/classes/instructor')
      .send({ ...data, access_type: 'free' });
    expect(res.statusCode).toBe(200);
    expect(service.createClass).toHaveBeenCalledWith(
      expect.objectContaining({ access_type: 'free' })
    );
    expect(res.body.data.access_type).toBe('free');
  });

  test('instructor class creation defaults access_type to paid when omitted', async () => {
    const created = {
      id: '2',
      instructor_id: 'test-user',
      title: 'Paid Class',
      access_type: 'paid',
    };
    service.createClass.mockResolvedValue(created);

    const res = await request(app)
      .post('/classes/instructor')
      .send({ title: 'Paid Class' });

    expect(res.statusCode).toBe(200);
    expect(service.createClass).toHaveBeenCalledWith(
      expect.objectContaining({ access_type: 'paid' })
    );
    expect(res.body.data.access_type).toBe('paid');
  });

  test('instructor cannot create class when feature disabled', async () => {
    planService.getPlanById.mockResolvedValueOnce({
      id: 'plan1',
      features: [{ feature_key: 'classes_create', value: 'false' }],
    });
    const res = await request(app)
      .post('/classes/instructor')
      .send({ title: 'Nope' });
    expect(res.statusCode).toBe(403);
    expect(service.createClass).not.toHaveBeenCalled();
  });

  test('instructor can update class without plan', async () => {
    const updated = { id: '1', title: 'Update' };
    service.getClassById = jest.fn().mockResolvedValue({ id: '1', instructor_id: 'test-user', title: 'Old' });
    service.updateClass.mockResolvedValue(updated);
    const res = await request(app).put('/classes/instructor/1').send({ title: 'Update' });
    expect(res.statusCode).toBe(200);
    expect(service.updateClass).toHaveBeenCalledWith('1', expect.any(Object));
  });

  test('instructor can publish class within plan limit', async () => {
    const updated = { id: '1', status: 'published', moderation_status: 'Pending' };
    service.togglePublishStatus.mockResolvedValue(updated);
    const res = await request(app).patch('/classes/instructor/1/status');
    expect(res.statusCode).toBe(200);
    expect(service.togglePublishStatus).toHaveBeenCalledWith('1');
  });

  test('blocks class creation when over plan limit', async () => {
    getActiveInstructorPlan.mockResolvedValue({ id: 'plan1', max_courses: 1 });
    service.countPublishedClasses.mockResolvedValue(1);
    const data = { id: '1', instructor_id: 'test-user', title: 'Test Class', status: 'published' };
    const res = await request(app).post('/classes/instructor').send(data);
    expect(res.statusCode).toBe(403);
    expect(service.createClass).not.toHaveBeenCalled();
  });
});
