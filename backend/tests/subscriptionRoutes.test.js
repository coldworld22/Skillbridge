const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/subscriptions/subscription.service', () => ({
  getActiveByUser: jest.fn(),
  createOrRenewSubscription: jest.fn(),
}));

jest.mock('../src/modules/payments/payments.service', () => ({
  getById: jest.fn(),
  STATUS: { PAID: 'paid' },
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
}));

const service = require('../src/modules/subscriptions/subscription.service');
const paymentsService = require('../src/modules/payments/payments.service');
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

describe('POST /api/user-subscriptions', () => {
  it('creates or renews a subscription for the authenticated user', async () => {
    const mock = { id: 's1', plan_id: 'p1' };
    service.createOrRenewSubscription.mockResolvedValue(mock);
    paymentsService.getById.mockResolvedValue({
      id: 'pay1',
      user_id: 'user1',
      item_type: 'plan',
      item_id: 'p1',
      status: 'paid',
    });

    const res = await request(app)
      .post('/api/user-subscriptions')
      .send({ plan_id: 'p1', payment_id: 'pay1' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.createOrRenewSubscription).toHaveBeenCalledWith({
      user_id: 'user1',
      plan_id: 'p1',
      interval: 'monthly',
    });
    expect(paymentsService.getById).toHaveBeenCalledWith('pay1');
  });

  it('returns 400 if payment is missing or invalid', async () => {
    paymentsService.getById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/user-subscriptions')
      .send({ plan_id: 'p1', payment_id: 'bad' });

    expect(res.status).toBe(400);
  });
});
