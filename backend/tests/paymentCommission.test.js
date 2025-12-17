const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getByUser: jest.fn(),
  STATUS: { PAID: 'paid', PENDING_PAYMENT: 'pending_payment' },
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn().mockResolvedValue({ type: 'card', active: true }),
}));

jest.mock('../src/services/paypalService', () => ({
  captureOrder: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findById: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/modules/library/library.service', () => ({
  recordPurchase: jest.fn(),
}));

jest.mock('../src/modules/coupons/coupons.service', () => ({
  getCouponById: jest.fn(),
  incrementUsage: jest.fn(),
}));

jest.mock('../src/modules/plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

jest.mock('../src/modules/subscriptions/subscription.service', () => ({
  createOrRenewSubscription: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/invoices/invoices.service', () => ({
  generateFromPayment: jest.fn(),
}));

jest.mock('../src/modules/books/book.service', () => ({
  getBookById: jest.fn().mockResolvedValue({
    instructor_id: 'bookInst',
    price: 50,
    tenant_id: 'tenant-1',
  }),
}));

jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({
  getTutorialById: jest.fn().mockResolvedValue({
    instructor_id: 'tutInst',
    price: 200,
    tenant_id: 'tenant-1',
  }),
}));

jest.mock('../src/modules/users/tutorials/enrollments/tutorialEnrollment.service', () => ({
  createEnrollment: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/modules/classes/class.service', () => ({
  getClassById: jest.fn().mockResolvedValue({
    instructor_id: 'inst1',
    price: 100,
    tenant_id: 'tenant-1',
  }),
}));

jest.mock('../src/modules/payouts/wallet.service', () => ({
  increment: jest.fn().mockResolvedValue({}),
  getByInstructor: jest.fn(),
  decrement: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/modules/payouts/payouts.service', () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({
  findEnrollment: jest.fn().mockResolvedValue(null),
  createEnrollment: jest.fn().mockResolvedValue({}),
  updateEnrollment: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'admin1' }; next(); },
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

const service = require('../src/modules/payments/payments.service');
const configService = require('../src/modules/paymentConfig/paymentConfig.service');
const routes = require('../src/modules/payments/payments.routes');
const walletService = require('../src/modules/payouts/wallet.service');
const payoutService = require('../src/modules/payouts/payouts.service');
const classService = require('../src/modules/classes/class.service');
const bookService = require('../src/modules/books/book.service');
const tutorialService = require('../src/modules/users/tutorials/tutorial.service');
const payoutRoutes = require('../src/modules/payouts/payouts.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/admin', routes);
app.use('/api/payouts', payoutRoutes);

describe('payment commission calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates commission for class payments', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { class: 10 } });
    service.create.mockResolvedValue({ id: 'p1', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'i1',
      amount: 100,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 10, instructor_amount: 90 })
    );
  });

  it('calculates commission for book payments', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { book: 20 } });
    service.create.mockResolvedValue({ id: 'p2', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'book',
      item_id: 'i2',
      amount: 50,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 10, instructor_amount: 40 })
    );
  });

  it('calculates commission for tutorial payments', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { tutorial: 30 } });
    service.create.mockResolvedValue({ id: 'p3', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'tutorial',
      item_id: 'i3',
      amount: 200,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 60, instructor_amount: 140 })
    );
  });

  it('falls back to default cut when settings missing', async () => {
    configService.getSettings.mockResolvedValue(null);
    service.create.mockResolvedValue({ id: 'p4', reference_id: 'ref', status: 'pending_payment' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'i4',
      amount: 100,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ platform_fee: 15, instructor_amount: 85 })
    );
  });
});

describe('wallet credit and debit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credits instructor wallet on paid class payment', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { class: 10 } });
    service.create.mockResolvedValue({ id: 'p5', reference_id: 'ref', status: 'paid' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'class',
      item_id: 'class1',
      amount: 100,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(classService.getClassById).toHaveBeenCalledWith('class1');
    expect(walletService.increment).toHaveBeenCalledWith(
      'inst1',
      90,
      null,
      'tenant-1'
    );
  });

  it('credits instructor wallet on paid book payment', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { book: 10 } });
    service.create.mockResolvedValue({ id: 'p6', reference_id: 'ref', status: 'paid' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'book',
      item_id: 'book1',
      amount: 50,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(bookService.getBookById).toHaveBeenCalledWith('book1');
    expect(walletService.increment).toHaveBeenCalledWith(
      'bookInst',
      45,
      null,
      'tenant-1'
    );
  });

  it('credits instructor wallet on paid tutorial payment', async () => {
    configService.getSettings.mockResolvedValue({ platformCut: { tutorial: 20 } });
    service.create.mockResolvedValue({ id: 'p7', reference_id: 'ref', status: 'paid' });

    const res = await request(app).post('/api/payments/admin').send({
      user_id: 'u1',
      method_id: 'm1',
      item_type: 'tutorial',
      item_id: 'tut1',
      amount: 200,
      status: 'paid',
    });

    expect(res.status).toBe(200);
    expect(tutorialService.getTutorialById).toHaveBeenCalledWith('tut1');
    expect(walletService.increment).toHaveBeenCalledWith(
      'tutInst',
      160,
      null,
      'tenant-1'
    );
  });

  it('debits wallet on approved payout', async () => {
    payoutService.getById.mockResolvedValue({ id: 'po1', instructor_id: 'inst1', amount: 50, status: 'pending' });
    payoutService.update.mockResolvedValue({ id: 'po1', status: 'approved' });
    walletService.getByInstructor.mockResolvedValue({ balance: 100 });

    const res = await request(app).patch('/api/payouts/po1').send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(walletService.decrement).toHaveBeenCalledWith('inst1', 50, 'tenant-1');
    expect(payoutService.update).toHaveBeenCalledWith(
      'po1',
      expect.objectContaining({ status: 'approved' }),
      'tenant-1'
    );
  });

  it('rejects payout when balance insufficient', async () => {
    payoutService.getById.mockResolvedValue({ id: 'po2', instructor_id: 'inst1', amount: 80, status: 'pending' });
    walletService.decrement.mockImplementation(() => { throw new Error('Insufficient balance'); });

    const res = await request(app).patch('/api/payouts/po2').send({ status: 'approved' });

    expect(res.status).toBe(400);
    expect(walletService.decrement).toHaveBeenCalledWith('inst1', 80, 'tenant-1');
    expect(payoutService.update).not.toHaveBeenCalled();
  });
});
