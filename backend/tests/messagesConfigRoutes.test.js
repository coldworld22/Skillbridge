const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/messagesConfig/messagesConfig.service', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/messagesConfig/messagesConfig.service');
const routes = require('../src/modules/messagesConfig/messagesConfig.routes');

const app = express();
app.use(express.json());
app.use('/api/messages/config', routes);

describe('GET /api/messages/config', () => {
  it('returns settings', async () => {
    const mock = { providers: [] };
    service.getSettings.mockResolvedValue(mock);

    const res = await request(app).get('/api/messages/config');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getSettings).toHaveBeenCalled();
  });
});

describe('PUT /api/messages/config', () => {
  it('updates settings', async () => {
    const payload = { providers: [{ name: "Twilio" }] };
    service.updateSettings.mockResolvedValue(payload);

    const res = await request(app).put('/api/messages/config').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(service.updateSettings).toHaveBeenCalledWith(payload);
  });
});
