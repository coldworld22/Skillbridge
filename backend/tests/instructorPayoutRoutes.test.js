const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payouts/wallet.service', () => ({
  getByInstructor: jest.fn(),
}));

jest.mock('../src/modules/payouts/payouts.service', () => ({
  create: jest.fn(),
  getByInstructor: jest.fn(),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/payments/payments.service', () => ({
  getInstructorTotals: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'instr1' };
    next();
  },
  isInstructor: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => {
    req.tenant = { id: 'tenant-1' };
    next();
  },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const walletService = require('../src/modules/payouts/wallet.service');
const payoutService = require('../src/modules/payouts/payouts.service');
const paymentConfigService = require('../src/modules/paymentConfig/paymentConfig.service');
const paymentsService = require('../src/modules/payments/payments.service');
const routes = require('../src/modules/payouts/payouts.routes');

const app = express();
app.use(express.json());
app.use('/api/payouts', routes);
app.use((err, _req, res, _next) => {
  res.status(err.statusCode || 500).json({ message: err.message });
});

describe('GET /api/payouts/wallet', () => {
  it('returns wallet balance for instructor', async () => {
    walletService.getByInstructor.mockResolvedValue({ balance: 100 });
    const res = await request(app).get('/api/payouts/wallet');
    expect(res.status).toBe(200);
    expect(walletService.getByInstructor).toHaveBeenCalledWith(
      'instr1',
      'tenant-1'
    );
    expect(res.body.data).toEqual({ balance: 100 });
  });
});

describe('GET /api/payouts/history', () => {
  it('returns payout history for instructor', async () => {
    payoutService.getByInstructor.mockResolvedValue([{ id: 'p1' }]);
    const res = await request(app).get('/api/payouts/history');
    expect(res.status).toBe(200);
    expect(payoutService.getByInstructor).toHaveBeenCalledWith(
      'instr1',
      'tenant-1'
    );
    expect(res.body.data).toEqual([{ id: 'p1' }]);
  });
});

describe('POST /api/payouts/request', () => {
  beforeEach(() => {
    walletService.getByInstructor.mockReset();
    payoutService.create.mockReset();
    payoutService.getByInstructor.mockReset();
    paymentConfigService.getSettings.mockReset();
    paymentsService.getInstructorTotals.mockReset();

    paymentConfigService.getSettings.mockResolvedValue({ minimumPayoutAmount: 0 });
    paymentsService.getInstructorTotals.mockResolvedValue({ totalPaid: 0 });
    payoutService.getByInstructor.mockResolvedValue([]);
  });

  it('creates payout request when funds sufficient', async () => {
    walletService.getByInstructor.mockResolvedValue({ balance: 200 });
    payoutService.create.mockResolvedValue({ id: 'p1' });
    paymentsService.getInstructorTotals.mockResolvedValue({ totalPaid: 200 });

    const res = await request(app)
      .post('/api/payouts/request')
      .send({ amount: 50 });

    expect(res.status).toBe(200);
    expect(walletService.getByInstructor).toHaveBeenCalledWith(
      'instr1',
      'tenant-1'
    );
    expect(payoutService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        instructor_id: 'instr1',
        amount: 50,
        tenant_id: 'tenant-1',
      })
    );
  });

  it('rejects when requesting for another instructor', async () => {
    walletService.getByInstructor.mockResolvedValue({ balance: 200 });

    const res = await request(app)
      .post('/api/payouts/request')
      .send({ amount: 50, instructor_id: 'other' });

    expect(res.status).toBe(403);
    expect(payoutService.create).not.toHaveBeenCalled();
  });

  it('rejects when funds are insufficient', async () => {
    walletService.getByInstructor.mockResolvedValue({ balance: 40 });
    paymentsService.getInstructorTotals.mockResolvedValue({ totalPaid: 40 });

    const res = await request(app)
      .post('/api/payouts/request')
      .send({ amount: 50 });

    expect(res.status).toBe(400);
    expect(payoutService.create).not.toHaveBeenCalled();
  });
  it('rejects when below minimum withdrawal amount', async () => {
    paymentConfigService.getSettings.mockResolvedValue({ minimumPayoutAmount: 100 });
    walletService.getByInstructor.mockResolvedValue({ balance: 500 });
    paymentsService.getInstructorTotals.mockResolvedValue({ totalPaid: 500 });

    const res = await request(app)
      .post('/api/payouts/request')
      .send({ amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Minimum withdrawal amount is 100');
    expect(payoutService.create).not.toHaveBeenCalled();
  });
});
