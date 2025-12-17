const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/subscriptions/subscription.service', () => ({
  getActiveByUser: jest.fn(),
  createOrRenewSubscription: jest.fn(),
  upgradeSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
}));

jest.mock('../src/modules/payments/payments.service', () => ({
  getById: jest.fn(),
  STATUS: { PAID: 'paid' },
}));

jest.mock('../src/modules/plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
}));

const service = require('../src/modules/subscriptions/subscription.service');
const paymentsService = require('../src/modules/payments/payments.service');
const plansService = require('../src/modules/plans/plans.service');
const routes = require('../src/modules/subscriptions/subscriptions.routes');

const app = express();
app.use(express.json());
app.use('/api/user-subscriptions', routes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/user-subscriptions/me', () => {
  it('returns active subscriptions for authenticated user', async () => {
    const mock = [{ id: 's1', plan_id: 'p1' }];
    service.getActiveByUser.mockResolvedValue(mock);

    const res = await request(app).get('/api/user-subscriptions/me?role=instructor');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getActiveByUser).toHaveBeenCalledWith('user1', 'instructor');
  });
});

describe('POST /api/user-subscriptions', () => {
  it('creates or renews a subscription for the authenticated user', async () => {
    const mock = { id: 's1', plan_id: 'p1' };
    service.createOrRenewSubscription.mockResolvedValue(mock);
    plansService.getPlanById.mockResolvedValue({
      id: 'p1',
      price_monthly: 9.99,
      price_yearly: 99.99,
    });
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
    plansService.getPlanById.mockResolvedValue({
      id: 'p1',
      price_monthly: 9.99,
      price_yearly: 99.99,
    });

    const res = await request(app)
      .post('/api/user-subscriptions')
      .send({ plan_id: 'p1', payment_id: 'bad' });

    expect(res.status).toBe(400);
  });

  it('allows subscribing to a free plan without a payment', async () => {
    const mock = { id: 's-free', plan_id: 'p-free' };
    service.createOrRenewSubscription.mockResolvedValue(mock);
    plansService.getPlanById.mockResolvedValue({
      id: 'p-free',
      price_monthly: 0,
      price_yearly: 0,
    });

    const res = await request(app)
      .post('/api/user-subscriptions')
      .send({ plan_id: 'p-free' });

    expect(res.status).toBe(200);
    expect(paymentsService.getById).not.toHaveBeenCalled();
    expect(service.createOrRenewSubscription).toHaveBeenCalledWith({
      user_id: 'user1',
      plan_id: 'p-free',
      interval: 'monthly',
    });
  });

  it('requires payment when plan price is greater than zero', async () => {
    plansService.getPlanById.mockResolvedValue({
      id: 'p2',
      price_monthly: 12,
      price_yearly: 0,
    });

    const res = await request(app)
      .post('/api/user-subscriptions')
      .send({ plan_id: 'p2' });

    expect(res.status).toBe(400);
    expect(paymentsService.getById).not.toHaveBeenCalled();
  });
});

describe('POST /api/user-subscriptions/upgrade', () => {
  it('upgrades an active subscription', async () => {
    const mock = { id: 's1', plan_id: 'p1' };
    service.upgradeSubscription.mockResolvedValue(mock);

    const res = await request(app).post('/api/user-subscriptions/upgrade');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.upgradeSubscription).toHaveBeenCalledWith('user1');
  });

  it('returns 400 if no active subscription to upgrade', async () => {
    service.upgradeSubscription.mockResolvedValue(null);

    const res = await request(app).post('/api/user-subscriptions/upgrade');

    expect(res.status).toBe(400);
  });
});

describe('POST /api/user-subscriptions/cancel', () => {
  it('cancels an active subscription', async () => {
    const mock = { id: 's1', status: 'cancelled' };
    service.cancelSubscription.mockResolvedValue(mock);

    const res = await request(app).post('/api/user-subscriptions/cancel');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.cancelSubscription).toHaveBeenCalledWith('user1');
  });

  it('returns 400 if no active subscription to cancel', async () => {
    service.cancelSubscription.mockResolvedValue(null);

    const res = await request(app).post('/api/user-subscriptions/cancel');

    expect(res.status).toBe(400);
  });
});
