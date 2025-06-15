const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/bookings/bookings.service', () => ({
  getAll: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/bookings/bookings.service');
const routes = require('../src/modules/bookings/bookings.routes');

const app = express();
app.use(express.json());
app.use('/api/bookings/admin', routes);

describe('GET /api/bookings/admin', () => {
  it('returns list of bookings', async () => {
    const mock = [{ id: '1' }];
    service.getAll.mockResolvedValue(mock);

    const res = await request(app).get('/api/bookings/admin');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getAll).toHaveBeenCalled();
  });
});
