const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/emailConfig/emailConfig.service', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/emailConfig/emailConfig.service');
const routes = require('../src/modules/emailConfig/emailConfig.routes');

const app = express();
app.use(express.json());
app.use('/api/email-config', routes);

describe('GET /api/email-config', () => {
  it('returns settings', async () => {
    const mock = { smtpHost: 'smtp.test.com' };
    service.getSettings.mockResolvedValue(mock);

    const res = await request(app).get('/api/email-config');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getSettings).toHaveBeenCalled();
  });
});

describe('PUT /api/email-config', () => {
  it('updates settings', async () => {
    const payload = { smtpHost: 'smtp.new.com' };
    service.updateSettings.mockResolvedValue(payload);

    const res = await request(app).put('/api/email-config').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(service.updateSettings).toHaveBeenCalledWith(payload);
  });
});
