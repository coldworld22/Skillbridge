const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  getAll: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'admin1' }; next(); },
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant-1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const service = require('../src/modules/payments/payments.service');
const routes = require('../src/modules/payments/payments.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/admin', routes);

describe('GET /api/payments/admin', () => {
  it('returns list of payments', async () => {
    const mock = [{ id: '1' }];
    service.getAll.mockResolvedValue(mock);

    const res = await request(app).get('/api/payments/admin');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getAll).toHaveBeenCalled();
  });
});
