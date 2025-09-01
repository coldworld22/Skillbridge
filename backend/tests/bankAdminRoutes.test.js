const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  approveBankPayment: jest.fn(),
}));

jest.mock('../src/modules/payments/paymentAccess', () => ({
  grantAccess: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findById: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../src/modules/invoices/invoices.service', () => ({
  generateFromPayment: jest.fn(),
}));

jest.mock('../src/modules/books/book.service', () => ({
  getBookById: jest.fn().mockResolvedValue({ instructor_id: 'bookInst' }),
}));

jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({
  getTutorialById: jest.fn().mockResolvedValue({ instructor_id: 'tutInst' }),
}));

jest.mock('../src/modules/classes/class.service', () => ({
  getClassById: jest.fn(),
}));

jest.mock('../src/modules/payouts/wallet.service', () => ({
  increment: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'admin1' }; next(); },
  isAdmin: (_req, _res, next) => next(),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const bookService = require('../src/modules/books/book.service');
const tutorialService = require('../src/modules/users/tutorials/tutorial.service');
const walletService = require('../src/modules/payouts/wallet.service');
const adminRoutes = require('../src/modules/payments/bank.admin.routes');

const app = express();
app.use(express.json());
app.use('/api/admin/payments/bank', adminRoutes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/admin/payments/bank/:id/approve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credits instructor wallet for book payments', async () => {
    paymentsService.approveBankPayment.mockResolvedValue({
      id: 'pay1',
      user_id: 'u1',
      item_type: 'book',
      item_id: 'book1',
      instructor_amount: 45,
    });

    const res = await request(app)
      .post('/api/admin/payments/bank/pay1/approve')
      .send({});

    expect(res.status).toBe(200);
    expect(bookService.getBookById).toHaveBeenCalledWith('book1');
    expect(walletService.increment).toHaveBeenCalledWith('bookInst', 45);
  });

  it('credits instructor wallet for tutorial payments', async () => {
    paymentsService.approveBankPayment.mockResolvedValue({
      id: 'pay2',
      user_id: 'u1',
      item_type: 'tutorial',
      item_id: 'tut1',
      instructor_amount: 160,
    });

    const res = await request(app)
      .post('/api/admin/payments/bank/pay2/approve')
      .send({});

    expect(res.status).toBe(200);
    expect(tutorialService.getTutorialById).toHaveBeenCalledWith('tut1');
    expect(walletService.increment).toHaveBeenCalledWith('tutInst', 160);
  });
});

