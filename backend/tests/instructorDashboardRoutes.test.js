const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/modules/users/instructor/instructor.service', () => ({
  getDashboardStats: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: '1' }; next(); },
  isInstructor: (_req, _res, next) => next(),
}));

const service = require('../src/modules/users/instructor/instructor.service');
const routes = require('../src/modules/users/instructor/instructor.routes');

const app = express();
app.use(express.json());
app.use('/api/users/instructor', routes);

describe('GET /api/users/instructor/dashboard-stats', () => {
  it('returns dashboard stats', async () => {
    const mockStats = { totalTutorials: 1 };
    service.getDashboardStats.mockResolvedValue(mockStats);

    const res = await request(app).get('/api/users/instructor/dashboard-stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockStats);
    expect(service.getDashboardStats).toHaveBeenCalled();
  });
});
