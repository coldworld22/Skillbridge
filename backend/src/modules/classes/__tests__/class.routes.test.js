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
  getAllClasses: jest.fn()
}));
const service = require('../class.service');
// Mock auth middleware to bypass authentication
jest.mock('../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
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
      expect.objectContaining({ status: 'draft' })
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
});
