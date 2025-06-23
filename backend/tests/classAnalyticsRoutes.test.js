const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/classes/class.service', () => ({
  getClassAnalytics: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/classes/class.service');
const routes = require('../src/modules/classes/class.routes');

const app = express();
app.use(express.json());
app.use('/api/users/classes', routes);

describe('GET /api/users/classes/admin/:id/analytics', () => {
  it('returns class analytics', async () => {
    const analytics = { totalStudents: 3 };
    service.getClassAnalytics.mockResolvedValue(analytics);

    const res = await request(app).get('/api/users/classes/admin/1/analytics');
    expect(res.status).toBe(200);
    expect(service.getClassAnalytics).toHaveBeenCalledWith('1');
    expect(res.body.data).toEqual(analytics);
  });
});
