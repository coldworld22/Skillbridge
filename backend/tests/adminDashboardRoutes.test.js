const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/users/admin/admin.service', () => ({
  getDashboardStats: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isSuperAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/users/admin/admin.service');
const routes = require('../src/modules/users/admin/admin.routes');

const app = express();
app.use(express.json());
app.use('/api/users/admin', routes);

describe('GET /api/users/admin/dashboard-stats', () => {
  it('returns dashboard stats', async () => {
    const mockStats = { totalUsers: 5 };
    service.getDashboardStats.mockResolvedValue(mockStats);

    const res = await request(app).get('/api/users/admin/dashboard-stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockStats);
    expect(service.getDashboardStats).toHaveBeenCalled();
  });
});
