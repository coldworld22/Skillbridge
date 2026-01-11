const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  STATUS: {
    AWAITING_APPROVAL: 'awaiting_approval',
    PAID: 'paid',
    PENDING_PAYMENT: 'pending_payment',
  },
  create: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getByType: jest.fn(),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findById: jest.fn(),
  findAdmins: jest.fn(() => []),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../src/modules/classes/class.service', () => ({
  getClassById: jest.fn(),
}));

jest.mock('../src/modules/books/book.service', () => ({
  getBookById: jest.fn(),
}));

jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({
  getTutorialById: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'u1' }; next(); },
  isStudent: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: '00000000-0000-0000-0000-000000000001' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const methodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const configService = require('../src/modules/paymentConfig/paymentConfig.service');
const userModel = require('../src/modules/users/user.model');
const classService = require('../src/modules/classes/class.service');
const bookService = require('../src/modules/books/book.service');
const tutorialService = require('../src/modules/users/tutorials/tutorial.service');
const routes = require('../src/modules/payments/bank.routes');

const app = express();
app.use(express.json());
app.use('/api/payments/bank', routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/payments/bank/initiate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    methodsService.getByType.mockResolvedValue({ id: 'm1', settings: {} });
    configService.getSettings.mockResolvedValue({ platformCut: {} });
    tutorialService.getTutorialById.mockResolvedValue({ id: 't1', price: 200 });
    classService.getClassById.mockResolvedValue({ id: 'c1', price: 200 });
    bookService.getBookById.mockResolvedValue({ id: 'b1', price: 200 });
    userModel.findById.mockResolvedValue({ id: 'u1', email: 'u@test.com', full_name: 'User' });
  });

  it('falls back to default cut when config missing item type', async () => {
    paymentsService.create.mockResolvedValue({ id: 'p1' });

    const res = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'tutorial', item_id: 't1', amount: 200 });

    expect(res.status).toBe(200);
    expect(paymentsService.create).toHaveBeenCalled();
  });

  it('rejects negative amount', async () => {
    const res = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'tutorial', item_id: 't1', amount: -5 });
    expect(res.status).toBe(400);
  });

  it('rejects invalid item type', async () => {
    const res = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'course', item_id: 't1', amount: 100 });
    expect(res.status).toBe(400);
  });

  it('rejects unsupported currency', async () => {
    const res = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'tutorial', item_id: 't1', amount: 100, currency: 'XYZ' });
    expect(res.status).toBe(400);
  });
});
