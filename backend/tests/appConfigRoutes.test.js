const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/appConfig/appConfig.service', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/appConfig/appConfig.service');
const routes = require('../src/modules/appConfig/appConfig.routes');

const app = express();
app.use(express.json());
app.use('/api/app-config', routes);

describe('GET /api/app-config', () => {
  it('returns settings', async () => {
    const mock = { appName: 'SkillBridge' };
    service.getSettings.mockResolvedValue(mock);

    const res = await request(app).get('/api/app-config');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getSettings).toHaveBeenCalled();
  });
});

describe('PUT /api/app-config', () => {
  it('updates settings', async () => {
    const payload = { appName: 'New Name' };
    service.updateSettings.mockResolvedValue(payload);

    const res = await request(app).put('/api/app-config').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(service.updateSettings).toHaveBeenCalledWith(payload);
  });
});

describe('PATCH /api/app-config/logo', () => {
  it('uploads logo and updates settings', async () => {
    const updated = { logo_url: '/uploads/app/logo.png' };
    service.getSettings.mockResolvedValue({});
    service.updateSettings.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/app-config/logo')
      .attach('logo', Buffer.from('test'), 'logo.png');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(updated);
    expect(service.updateSettings).toHaveBeenCalled();
  });
});

describe('PATCH /api/app-config/favicon', () => {
  it('uploads favicon and updates settings', async () => {
    const updated = { favicon_url: '/uploads/app/favicon.ico' };
    service.getSettings.mockResolvedValue({});
    service.updateSettings.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/app-config/favicon')
      .attach('favicon', Buffer.from('test'), 'favicon.ico');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(updated);
    expect(service.updateSettings).toHaveBeenCalled();
  });
});
