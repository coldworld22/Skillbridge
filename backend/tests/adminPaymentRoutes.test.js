const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  getAll: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
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
