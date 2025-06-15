const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/community/admin/admin.service', () => ({
  getAllDiscussions: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/community/admin/admin.service');
const routes = require('../src/modules/community/admin/admin.routes');

const app = express();
app.use(express.json());
app.use('/api/community/admin', routes);

describe('GET /api/community/admin/discussions', () => {
  it('returns list of discussions', async () => {
    const mock = [{ id: '1' }];
    service.getAllDiscussions.mockResolvedValue(mock);

    const res = await request(app).get('/api/community/admin/discussions');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getAllDiscussions).toHaveBeenCalled();
  });
});
