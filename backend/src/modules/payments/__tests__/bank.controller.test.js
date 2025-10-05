const request = require('supertest');
const express = require('express');

jest.mock('../../../utils/logger.js', () => ({
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'student-1' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isInstructor: (_req, _res, next) => next(),
  isInstructorOrAdmin: (_req, _res, next) => next(),
}));

jest.mock('../../paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../../paymentMethods/paymentMethods.service', () => ({
  getByType: jest.fn(),
}));

jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../../../services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../../users/user.model', () => ({
  findById: jest.fn(),
  findAdmins: jest.fn(),
}));

jest.mock('../../payouts/wallet.service', () => ({
  increment: jest.fn(),
}));

jest.mock('../../classes/class.service', () => ({
  getClassById: jest.fn(),
}));

jest.mock('../../books/book.service', () => ({
  getBookById: jest.fn(),
}));

jest.mock('../../users/tutorials/tutorial.service', () => ({
  getTutorialById: jest.fn(),
}));

jest.mock('../../plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

jest.mock('../../coupons/coupons.service', () => ({
  getCouponById: jest.fn(),
}));

jest.mock('../payments.service', () => ({
  STATUS: {
    AWAITING_APPROVAL: 'awaiting_approval',
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
  },
  create: jest.fn(),
  approveBankPayment: jest.fn(),
  rejectBankPayment: jest.fn(),
}));

jest.mock('../paymentAccess', () => ({
  grantAccess: jest.fn(),
}));

jest.mock('../../invoices/invoices.service', () => ({
  generateFromPayment: jest.fn(),
  resolveInvoiceAttachmentPath: jest.fn(),
}));

jest.mock('../../invoices/helpers/invoicePath', () => ({
  resolveInvoicePdfPath: jest.fn(),
}));

const paymentConfigService = require('../../paymentConfig/paymentConfig.service');
const paymentMethodsService = require('../../paymentMethods/paymentMethods.service');
const notificationService = require('../../notifications/notifications.service');
const mailService = require('../../../services/mailService');
const userModel = require('../../users/user.model');
const classService = require('../../classes/class.service');
const paymentsService = require('../payments.service');
const bankRoutes = require('../bank.routes');

describe('Bank controller initiateBankPayment', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    paymentConfigService.getSettings.mockResolvedValue({ platformCut: {} });
    paymentMethodsService.getByType.mockResolvedValue({
      id: 'bank-method-1',
      settings: {},
    });
    classService.getClassById.mockResolvedValue({ id: 'class-1', price: 100 });
    userModel.findById.mockResolvedValue({
      id: 'student-1',
      email: 'student@example.com',
      full_name: 'Student Example',
    });
    userModel.findAdmins.mockResolvedValue([]);
    mailService.sendMail.mockResolvedValue();
    notificationService.createNotification.mockResolvedValue();
    paymentsService.create.mockImplementation(async (payload) => payload);

    app = express();
    app.use(express.json());
    app.use('/payments/bank', bankRoutes);
    app.use((err, _req, res, _next) => {
      res.status(err.statusCode || 500).json({ message: err.message });
    });
  });

  test('persists reference and receipt when provided', async () => {
    const response = await request(app)
      .post('/payments/bank/initiate')
      .send({
        item_type: 'class',
        item_id: 'class-1',
        amount: 100,
        reference: 'ref-xyz',
        receipt_url: 'https://cdn.example/receipt.png',
      });

    expect(response.status).toBe(200);
    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reference_id: 'ref-xyz',
        receipt_url: 'https://cdn.example/receipt.png',
        bank_details: expect.objectContaining({
          reference: 'ref-xyz',
          receipt_url: 'https://cdn.example/receipt.png',
        }),
      })
    );
  });
});

