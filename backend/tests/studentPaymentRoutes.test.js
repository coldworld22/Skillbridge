const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  getByUser: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
  isStudent: (_req, _res, next) => next(),
}));

const service = require('../src/modules/payments/payments.service');
const routes = require('../src/modules/payments/student.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/student', routes);

describe('GET /api/payments/student', () => {
  it('returns student payments', async () => {
    const mock = [{ id: 'p1' }];
    service.getByUser.mockResolvedValue(mock);

    const res = await request(app).get('/api/payments/student');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getByUser).toHaveBeenCalledWith('user1');
  });
});
