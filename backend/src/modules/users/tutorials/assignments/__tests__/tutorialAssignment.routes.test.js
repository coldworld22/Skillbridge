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

jest.mock('../tutorialAssignment.service', () => ({
  getByTutorial: jest.fn(),
  getAllAssignments: jest.fn(),
  getAssignmentWithTutorial: jest.fn(),
  getById: jest.fn(),
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
}));
const service = require('../tutorialAssignment.service');

jest.mock('../submission.service', () => ({
  getMySubmission: jest.fn(),
}));
const submissionService = require('../submission.service');

const TUTORIAL_ID = '123e4567-e89b-12d3-a456-426614174000';

jest.mock('../../tutorial.service', () => ({
  getTutorialById: jest.fn(() => Promise.resolve({ id: TUTORIAL_ID, title: 'Tutorial' })),
}));

jest.mock('../../enrollments/tutorialEnrollment.service', () => ({
  getByTutorial: jest.fn(() =>
    Promise.resolve([
      { id: 's1', email: 's1@test.com', phone: '111' },
      { id: 's2', email: 's2@test.com', phone: '222' },
    ])
  ),
  findEnrollment: jest.fn(() => Promise.resolve({ status: 'active' })),
  recalculateProgress: jest.fn(() => Promise.resolve(100)),
}));

jest.mock('../../../../notifications/notifications.service', () => ({
  createNotification: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../../../../../utils/email', () => ({
  sendAssignmentEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../services/smsService', () => ({
  sendSMS: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'test-user', role: 'Instructor', roles: ['Instructor'] };
    next();
  },
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
}));

jest.mock(
  '../../../../../middleware/auth/verifyTutorialAccess',
  () => jest.fn((_req, _res, next) => next())
);

const verifyTutorialAccess = require('../../../../../middleware/auth/verifyTutorialAccess');
const db = require('../../../../../config/database');

const routes = require('../../tutorial.routes');
const emailUtil = require('../../../../../utils/email');
const smsService = require('../../../../../services/smsService');
const notificationService = require('../../../../notifications/notifications.service');

const app = express();
app.use(express.json());
app.use('/api/users/tutorials', routes);

describe('Tutorial assignment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    submissionService.getMySubmission.mockResolvedValue(null);
  });

  test('get assignments by tutorial', async () => {
    const list = [{ id: '1' }];
    service.getByTutorial.mockResolvedValue(list);
    const res = await request(app).get(`/api/users/tutorials/assignments/${TUTORIAL_ID}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
  });

  test('get assignment detail by id', async () => {
    service.getAssignmentWithTutorial.mockResolvedValue({
      id: 'a1',
      title: 'Assignment',
      tutorial_id: TUTORIAL_ID,
      tutorial_title: 'Tutorial',
      instructor_id: 'test-user',
    });
    const res = await request(app).get('/api/users/tutorials/assignments/item/a1');
    expect(res.statusCode).toBe(200);
    expect(service.getAssignmentWithTutorial).toHaveBeenCalledWith('a1');
    expect(res.body.data.assignment.id).toBe('a1');
  });

  test('get all assignments', async () => {
    const list = [{ id: '1' }];
    service.getAllAssignments.mockResolvedValue(list);
    const res = await request(app).get('/api/users/tutorials/assignments/admin');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
  });

  test('create assignment sends messages', async () => {
    service.createAssignment.mockResolvedValue({
      id: '1',
      title: 'New',
      due_date: '2024-01-01',
    });
    const res = await request(app)
      .post(`/api/users/tutorials/assignments/${TUTORIAL_ID}`)
      .send({ title: 'New', due_date: '2024-01-01' });
    expect(res.statusCode).toBe(200);
    expect(service.createAssignment).toHaveBeenCalled();
    expect(emailUtil.sendAssignmentEmail).toHaveBeenCalledTimes(2);
    expect(smsService.sendSMS).toHaveBeenCalledTimes(2);
    expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
  });

  test('create assignment fails with invalid date', async () => {
    const res = await request(app)
      .post(`/api/users/tutorials/assignments/${TUTORIAL_ID}`)
      .send({ title: 'New', due_date: 'not-a-date' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Validation error');
    expect(service.createAssignment).not.toHaveBeenCalled();
  });

  test('create assignment fails with missing title', async () => {
    const res = await request(app)
      .post(`/api/users/tutorials/assignments/${TUTORIAL_ID}`)
      .send({ due_date: '2024-01-01' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Validation error');
    expect(service.createAssignment).not.toHaveBeenCalled();
  });

  test('update assignment', async () => {
    service.updateAssignment.mockResolvedValue({ id: '1' });
    const res = await request(app)
      .put('/api/users/tutorials/assignments/1')
      .send({ title: 'Edit' });
    expect(res.statusCode).toBe(200);
    expect(service.updateAssignment).toHaveBeenCalled();
  });

  test('delete assignment', async () => {
    service.deleteAssignment.mockResolvedValue();
    const res = await request(app).delete('/api/users/tutorials/assignments/1');
    expect(res.statusCode).toBe(200);
    expect(service.deleteAssignment).toHaveBeenCalled();
  });

  test('instructor without ownership cannot create assignment', async () => {
    verifyTutorialAccess.mockImplementationOnce(
      jest.requireActual('../../../../../middleware/auth/verifyTutorialAccess')
    );
    db.first
      .mockResolvedValueOnce({ instructor_id: 'other-user' })
      .mockResolvedValueOnce(null);
    const res = await request(app)
      .post(`/api/users/tutorials/assignments/${TUTORIAL_ID}`)
      .send({ title: 'New', due_date: '2024-01-01T00:00:00.000Z' });
    expect([403, 404]).toContain(res.statusCode);
    expect(service.createAssignment).not.toHaveBeenCalled();
  });
});
