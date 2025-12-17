const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/contactConfig/contactConfig.service', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn(() => [{ id: 'admin1' }]),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'admin1' }; next(); },
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/contactConfig/contactConfig.service');
const routes = require('../src/modules/contactConfig/contactConfig.routes');

const app = express();
app.use(express.json());
app.use('/api/contact-config', routes);

describe('GET /api/contact-config', () => {
  it('returns settings', async () => {
    const mock = { email: 'a@test.com' };
    service.getSettings.mockResolvedValue(mock);

    const res = await request(app).get('/api/contact-config');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getSettings).toHaveBeenCalled();
  });
});

describe('PUT /api/contact-config', () => {
  it('updates settings', async () => {
    const payload = { email: 'b@test.com' };
    service.updateSettings.mockResolvedValue(payload);

    const res = await request(app).put('/api/contact-config').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(service.updateSettings).toHaveBeenCalledWith(payload);
  });
});
