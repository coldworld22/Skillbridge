const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({ raw: jest.fn(() => Promise.resolve()) }));

jest.mock('../src/modules/support/support.service', () => ({
  getAnalytics: jest.fn(),

}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),

  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/support/support.service');
const routes = require('../src/modules/support/support.routes');

const app = express();
app.use(express.json());
app.use('/api/support', routes);

describe('GET /api/support/admin/analytics', () => {
  it('returns analytics', async () => {
    const mock = { open: 1, resolved: 2, closed: 3 };
    service.getAnalytics.mockResolvedValue(mock);
    const res = await request(app).get('/api/support/admin/analytics');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getAnalytics).toHaveBeenCalled();
  });
});

