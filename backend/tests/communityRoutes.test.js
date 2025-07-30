const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/community/public/public.service', () => ({
  listDiscussions: jest.fn(),
  getDiscussion: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
}));

const service = require('../src/modules/community/public/public.service');
const routes = require('../src/modules/community/public/public.routes');

const app = express();
app.use(express.json());
app.use('/api/community', routes);

describe('GET /api/community/discussions', () => {
  it('returns discussions', async () => {
    const mock = [{ id: '1' }];
    service.listDiscussions.mockResolvedValue(mock);
    const res = await request(app).get('/api/community/discussions');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
  });
});

describe('GET /api/community/discussions/:id', () => {
  it('returns discussion by id', async () => {
    const mock = { id: '1' };
    service.getDiscussion.mockResolvedValue(mock);
    const res = await request(app).get('/api/community/discussions/1');
    expect(res.status).toBe(200);
    expect(service.getDiscussion).toHaveBeenCalledWith(
      '1',
      undefined,
      expect.anything(),
      undefined
    );
    expect(res.body.data).toEqual(mock);
  });
});
