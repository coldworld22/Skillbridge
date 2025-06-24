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

jest.mock('../classLesson.service', () => ({
  getByClass: jest.fn(),
  createLesson: jest.fn(),
  updateLesson: jest.fn(),
  deleteLesson: jest.fn(),
}));
const service = require('../classLesson.service');

jest.mock('../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'test-user' };
    next();
  },
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const routes = require('../../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('Class lesson routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('get lessons by class', async () => {
    const list = [{ id: '1' }];
    service.getByClass.mockResolvedValue(list);
    const res = await request(app).get('/classes/lessons/class/abc');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(list);
  });

  test('create lesson', async () => {
    service.createLesson.mockResolvedValue({ id: '1' });
    const res = await request(app)
      .post('/classes/lessons/class/abc')
      .send({ title: 'New Lesson' });
    expect(res.statusCode).toBe(200);
    expect(service.createLesson).toHaveBeenCalled();
  });

  test('update lesson', async () => {
    service.updateLesson.mockResolvedValue({ id: '1' });
    const res = await request(app)
      .put('/classes/lessons/1')
      .send({ title: 'Edit' });
    expect(res.statusCode).toBe(200);
    expect(service.updateLesson).toHaveBeenCalled();
  });

  test('delete lesson', async () => {
    service.deleteLesson.mockResolvedValue();
    const res = await request(app).delete('/classes/lessons/1');
    expect(res.statusCode).toBe(200);
    expect(service.deleteLesson).toHaveBeenCalled();
  });
});
