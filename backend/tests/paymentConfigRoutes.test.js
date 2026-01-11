const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
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

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const service = require('../src/modules/paymentConfig/paymentConfig.service');
const routes = require('../src/modules/paymentConfig/paymentConfig.routes');

const app = express();
app.use(express.json());
app.use('/api/payment-config', routes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PUT /api/payment-config', () => {
  it('updates settings with valid platformCut', async () => {
    const payload = { platformCut: { class: 10, book: 20 } };
    service.updateSettings.mockResolvedValue(payload);

    const res = await request(app).put('/api/payment-config').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(service.updateSettings).toHaveBeenCalledWith(payload);
  });

  it('returns 400 for out-of-range values', async () => {
    const payload = { platformCut: { class: 101 } };
    const res = await request(app).put('/api/payment-config').send(payload);
    expect(res.status).toBe(400);
    expect(service.updateSettings).not.toHaveBeenCalled();
  });

  it('returns 400 for non-numeric values', async () => {
    const payload = { platformCut: { class: 'ten' } };
    const res = await request(app).put('/api/payment-config').send(payload);
    expect(res.status).toBe(400);
    expect(service.updateSettings).not.toHaveBeenCalled();
  });
});
