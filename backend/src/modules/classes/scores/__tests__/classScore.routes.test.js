const request = require('supertest');
const express = require('express');

jest.mock('../../../../config/database', () => ({ raw: jest.fn(() => Promise.resolve()) }));

jest.mock('../classScore.service', () => ({
  setPolicy: jest.fn(),
  calculateForClass: jest.fn(),
  issueCertificate: jest.fn(),
  calculateForStudent: jest.fn(),
}));

jest.mock('../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'u1' };
    next();
  },
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../classScore.service');
const routes = require('../../class.routes');

const app = express();
app.use(express.json());
app.use('/classes', routes);

describe('class score routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('set scoring policy', async () => {
    service.setPolicy.mockResolvedValue({ id: 1 });
    const res = await request(app).post('/classes/scores/policy/1').send({ pass_score: 70 });
    expect(res.status).toBe(200);
    expect(service.setPolicy).toHaveBeenCalled();
  });

  test('list scores', async () => {
    service.calculateForClass.mockResolvedValue([]);
    const res = await request(app).get('/classes/scores/instructor/1');
    expect(res.status).toBe(200);
    expect(service.calculateForClass).toHaveBeenCalled();
  });

  test('issue certificate', async () => {
    service.issueCertificate.mockResolvedValue({ id: 'c1' });
    const res = await request(app).post('/classes/scores/instructor/1/students/u1/issue');
    expect(res.status).toBe(200);
    expect(service.issueCertificate).toHaveBeenCalled();
  });

  test('get my score', async () => {
    service.calculateForStudent.mockResolvedValue({ total_score: 80 });
    const res = await request(app).get('/classes/scores/student/1');
    expect(res.status).toBe(200);
    expect(service.calculateForStudent).toHaveBeenCalled();
  });
});
