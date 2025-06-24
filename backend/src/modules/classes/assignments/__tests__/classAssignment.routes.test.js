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
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
}));
const service = require('../classAssignment.service');

jest.mock('../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'test-user' }; next(); },
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const routes = require('../../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Class assignment routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('get assignments by class', async () => {
    const list = [{ id: '1' }];
    service.getByClass.mockResolvedValue(list);
    const res = await request(app).get('/classes/assignments/class/abc');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
  });

  test('create assignment', async () => {
    service.createAssignment.mockResolvedValue({ id: '1' });
    const res = await request(app)
      .post('/classes/assignments/class/abc')
      .send({ title: 'New' });
    expect(res.statusCode).toBe(200);
    expect(service.createAssignment).toHaveBeenCalled();
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
