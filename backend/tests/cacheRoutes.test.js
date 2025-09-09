const request = require('supertest');
const express = require('express');

// Mock auth middleware to simulate a logged-in non-admin user
jest.mock('../src/middleware/auth/authMiddleware', () => {
  const actual = jest.requireActual('../src/middleware/auth/authMiddleware');
  return {
    ...actual,
    verifyToken: (req, _res, next) => {
      req.user = { id: '1', roles: ['student'] };
      next();
    },
  };
});

const routes = require('../src/routes/cache.routes');

const app = express();
app.use(express.json());
app.use('/api/admin/cache', routes);

describe('POST /api/admin/cache/clear', () => {
  it('returns 403 for non-admin users', async () => {
    const res = await request(app).post('/api/admin/cache/clear');
    expect(res.status).toBe(403);
  });
});
