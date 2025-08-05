const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/ads/ads.service', () => ({
  getAds: jest.fn(),
  createAd: jest.fn(),
  getAdById: jest.fn(),
  findByTitle: jest.fn(),
  updateAd: jest.fn(),
  deleteAd: jest.fn(),
  getAdAnalytics: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn(() => [{ id: 'admin1' }]),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'user1', role: 'instructor', roles: ['instructor'] };
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

describe('GET /api/ads/admin', () => {
  it('returns ads for the authenticated instructor', async () => {
    const mock = [{ id: '1', created_by: 'user1' }];
    service.getAds.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads/admin');
    expect(res.status).toBe(200);
    expect(service.getAds).toHaveBeenCalledWith(true, 'user1');
    expect(res.body.data).toEqual(mock);
  });
});

describe('GET /api/ads/admin/check-title', () => {
  it('returns exists true when title found', async () => {
    service.findByTitle.mockResolvedValue({ id: '1', title: 'Test' });
    const res = await request(app)
      .get('/api/ads/admin/check-title')
      .query({ title: 'Test' });
    expect(res.status).toBe(200);
    expect(service.findByTitle).toHaveBeenCalledWith('Test');
    expect(res.body.data.exists).toBe(true);
  });

  it('returns exists false when title not found', async () => {
    service.findByTitle.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/ads/admin/check-title')
      .query({ title: 'Unknown' });
    expect(res.status).toBe(200);
    expect(service.findByTitle).toHaveBeenCalledWith('Unknown');
    expect(res.body.data.exists).toBe(false);
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

describe('PUT /api/ads/:id', () => {
  it('updates ad', async () => {
    const payload = { title: 'Updated' };
    service.updateAd = jest.fn().mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).put('/api/ads/1').send(payload);
    expect(res.status).toBe(200);
    expect(service.updateAd).toHaveBeenCalledWith('1', expect.any(Object));
  });
});

describe('DELETE /api/ads/:id', () => {
  it('deletes ad', async () => {
    service.deleteAd = jest.fn().mockResolvedValue(1);
    const res = await request(app).delete('/api/ads/1');
    expect(res.status).toBe(200);
    expect(service.deleteAd).toHaveBeenCalledWith('1');
  });
});

describe('GET /api/ads/:id/analytics', () => {
  it('returns ad analytics', async () => {
    const analytics = { views: 5, ctr: 1, clicks: 2, unique_viewers: 3 };
    service.getAdAnalytics = jest.fn().mockResolvedValue(analytics);
    const res = await request(app).get('/api/ads/1/analytics');
    expect(res.status).toBe(200);
    expect(service.getAdAnalytics).toHaveBeenCalledWith('1');
    expect(res.body.data.views).toBe(5);
    expect(res.body.data.conversions).toBe(2);
  });
});
