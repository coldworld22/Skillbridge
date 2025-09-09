const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
  STATUS: { PENDING_PAYMENT: 'PENDING_PAYMENT', PAID: 'PAID', REJECTED: 'REJECTED' },
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getByType: jest.fn(),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/services/paypalService', () => ({
  createOrder: jest.fn(),
}));

jest.mock('../src/modules/plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'u1' }; next(); },
  isStudent: (_req, _res, next) => next(),
}));

// Mock unrelated routes used by grouped payments router
jest.mock('../src/modules/paymentMethods/paymentMethods.routes', () => require('express').Router());
jest.mock('../src/modules/paymentMethods/paymentMethods.public.routes', () => require('express').Router());
jest.mock('../src/modules/payments/student.routes', () => require('express').Router());
jest.mock('../src/modules/payments/bank.routes', () => require('express').Router());
jest.mock('../src/modules/payments/crypto.routes', () => require('express').Router());
jest.mock('../src/modules/payments/coinbase.routes', () => require('express').Router());
jest.mock('../src/modules/payments/stripe.routes', () => require('express').Router());
jest.mock('../src/modules/payments/payments.routes', () => require('express').Router());
jest.mock('../src/modules/invoices/invoices.routes', () => require('express').Router());
jest.mock('../src/modules/invoices/student.routes', () => require('express').Router());
jest.mock('../src/modules/invoices/instructor.routes', () => require('express').Router());
jest.mock('../src/modules/payments/bank.admin.routes', () => require('express').Router());
jest.mock('../src/modules/paymentConfig/paymentConfig.routes', () => require('express').Router());
jest.mock('../src/modules/payouts/payouts.routes', () => require('express').Router());

const paymentsService = require('../src/modules/payments/payments.service');
const methodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const configService = require('../src/modules/paymentConfig/paymentConfig.service');
const paypalService = require('../src/services/paypalService');
const plansService = require('../src/modules/plans/plans.service');
const routes = require('../src/routes/payments');

const app = express();
app.use(express.json());
app.use(routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/payments/paypal/create', () => {
  it('creates order and stores payment record', async () => {
    methodsService.getByType.mockResolvedValue({ id: 'm2', settings: {} });
    configService.getSettings.mockResolvedValue({ platformCut: { class: 15 } });
    paypalService.createOrder.mockResolvedValue({
      id: 'o1',
      links: [{ rel: 'approve', href: 'https://paypal.test/approve' }],
    });
    paymentsService.create.mockResolvedValue({ id: 'p1' });

    const res = await request(app)
      .post('/api/payments/paypal/create')
      .send({ item_type: 'class', item_id: 'c1', amount: 100 });

    expect(res.status).toBe(200);
    expect(res.body.data.approval_url).toBe('https://paypal.test/approve');
    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reference_id: 'o1',
        platform_fee: 15,
        instructor_amount: 85,
      })
    );
  });

  it('validates plan price and initiates payment', async () => {
    methodsService.getByType.mockResolvedValue({ id: 'm2', settings: {} });
    configService.getSettings.mockResolvedValue({ platformCut: { plan: 10 } });
    paypalService.createOrder.mockResolvedValue({
      id: 'o2',
      links: [{ rel: 'approve', href: 'https://paypal.test/plan' }],
    });
    plansService.getPlanById.mockResolvedValue({
      id: 'plan1',
      price_monthly: 100,
      price_yearly: 200,
    });
    paymentsService.create.mockResolvedValue({ id: 'p2' });

    const res = await request(app)
      .post('/api/payments/paypal/create')
      .send({ item_type: 'plan', item_id: 'plan1', amount: 100 });

    expect(res.status).toBe(200);
    expect(plansService.getPlanById).toHaveBeenCalledWith('plan1');
    expect(res.body.data.approval_url).toBe('https://paypal.test/plan');
    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ item_type: 'plan', item_id: 'plan1', amount: 100 })
    );
  });
});
