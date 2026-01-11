const request = require('supertest');
const express = require('express');

jest.mock('../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve(null));
  db.select = jest.fn(() => db);
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
  db.del = jest.fn(() => db);
  return db;
});

jest.mock('../submission.service', () => ({
  getByAssignment: jest.fn(),
  getSubmissionForUser: jest.fn(),
  getSubmissionById: jest.fn(),
  createSubmission: jest.fn(),
  updateSubmission: jest.fn(),
  deleteSubmission: jest.fn(),
}));
const service = require('../submission.service');

jest.mock('../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'test-user' }; next(); },
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
}));

jest.mock('../../../../middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant-1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

jest.mock('../../../../middleware/auth/verifyAssignmentOwnership', () => (_req, _res, next) => next());
jest.mock('../../../../middleware/auth/verifySubmissionOwnership', () => (_req, _res, next) => next());
jest.mock('../../../../middleware/storage', () => ({
  checkAndConsumeStorage: () => (_req, _res, next) => next(),
}));

const routes = require('../../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Assignment submission routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getSubmissionForUser.mockResolvedValue(null);
    service.getSubmissionById.mockResolvedValue({ id: '1', file_url: null });
  });

  test('list submissions by assignment', async () => {
    const list = [{ id: '1' }];
    service.getByAssignment.mockResolvedValue(list);
    const res = await request(app).get('/classes/assignments/submissions/assignment/abc');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
  });

  test('create submission', async () => {
    service.createSubmission.mockResolvedValue({ id: '1' });
    const res = await request(app)
      .post('/classes/assignments/submissions/assignment/abc')
      .send({ file_url: 'url' });
    expect(res.statusCode).toBe(200);
    expect(service.createSubmission).toHaveBeenCalled();
  });

  test('update submission', async () => {
    service.updateSubmission.mockResolvedValue({ id: '1' });
    const res = await request(app)
      .put('/classes/assignments/submissions/1')
      .send({ grade: 90 });
    expect(res.statusCode).toBe(200);
    expect(service.updateSubmission).toHaveBeenCalled();
  });

  test('delete submission', async () => {
    service.deleteSubmission.mockResolvedValue();
    const res = await request(app).delete('/classes/assignments/submissions/1');
    expect(res.statusCode).toBe(200);
    expect(service.deleteSubmission).toHaveBeenCalled();
  });
});
