const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/subscriptions/subscription.service', () => ({
  getActiveByUser: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
}));

const service = require('../src/modules/subscriptions/subscription.service');
const routes = require('../src/modules/subscriptions/subscriptions.routes');

const app = express();
app.use(express.json());
app.use('/api/user-subscriptions', routes);

describe('GET /api/user-subscriptions/me', () => {
  it('returns active subscriptions for authenticated user', async () => {
    const mock = [{ id: 's1', plan_id: 'p1' }];
    service.getActiveByUser.mockResolvedValue(mock);

    const res = await request(app).get('/api/user-subscriptions/me');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getActiveByUser).toHaveBeenCalledWith('user1');
  });
});
