const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/socialLoginConfig/socialLoginConfig.service', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));

jest.mock('../src/config/passport', () => ({
  initStrategies: jest.fn(),
  passport: {},
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/socialLoginConfig/socialLoginConfig.service');
const routes = require('../src/modules/socialLoginConfig/socialLoginConfig.routes');

const app = express();
app.use(express.json());
app.use('/api/social-login/config', routes);

describe('GET /api/social-login/config', () => {
  it('returns settings', async () => {
    const mock = { enabled: true };
    service.getSettings.mockResolvedValue(mock);

    const res = await request(app).get('/api/social-login/config');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getSettings).toHaveBeenCalled();
  });
});

describe('PUT /api/social-login/config', () => {
  it('updates settings', async () => {
    const payload = { enabled: false };
    service.updateSettings.mockResolvedValue(payload);

    const res = await request(app).put('/api/social-login/config').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(service.updateSettings).toHaveBeenCalledWith(payload);
  });
});
