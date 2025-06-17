const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/ads/ads.service', () => ({
  getAds: jest.fn(),
  createAd: jest.fn(),
  getAdById: jest.fn(),
  findByTitle: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'user1' };
    next();
  },
  isInstructorOrAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/ads/ads.service');
const routes = require('../src/modules/ads/ads.routes');

const app = express();
app.use(express.json());
app.use('/api/ads', routes);

describe('GET /api/ads', () => {
  it('returns ads list', async () => {
    const mock = [{ id: '1' }];
    service.getAds.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
  });
});

describe('POST /api/ads/admin', () => {
  it('creates ad', async () => {
    const payload = { title: 'Test', image_url: 'img.jpg' };
    service.createAd.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).post('/api/ads/admin').send(payload);
    expect(res.status).toBe(200);
    expect(service.createAd).toHaveBeenCalled();
  });
});
