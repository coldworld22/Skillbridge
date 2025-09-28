jest.mock('../src/modules/payments/payments.service', () => ({
  STATUS: { PAID: 'paid', AWAITING_APPROVAL: 'awaiting_approval', REJECTED: 'rejected' },
  create: jest.fn(),
  update: jest.fn(),
  approveBankPayment: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({ sendSMS: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn(), findAdmins: jest.fn() }));
jest.mock('../src/modules/library/library.service', () => ({ recordPurchase: jest.fn() }));
jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({ findEnrollment: jest.fn(), updateEnrollment: jest.fn(), createEnrollment: jest.fn() }));
jest.mock('../src/modules/users/tutorials/enrollments/tutorialEnrollment.service', () => ({ createEnrollment: jest.fn() }));
jest.mock('../src/modules/paymentConfig/paymentConfig.service', () => ({ getSettings: jest.fn() }));
jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({ getById: jest.fn(), getByType: jest.fn() }));
jest.mock('../src/services/paypalService', () => ({ captureOrder: jest.fn() }));
jest.mock('../src/modules/notifications/notifications.service', () => ({ createNotification: jest.fn() }));
jest.mock('../src/services/mailService', () => ({ sendMail: jest.fn() }));
jest.mock('../src/modules/coupons/coupons.service', () => ({ getCouponById: jest.fn(), incrementUsage: jest.fn() }));
jest.mock('../src/modules/plans/plans.service', () => ({ getPlanById: jest.fn() }));
jest.mock('../src/modules/subscriptions/subscription.service', () => ({ createOrRenewSubscription: jest.fn() }));
jest.mock('../src/modules/payouts/wallet.service', () => ({ increment: jest.fn() }));
jest.mock('../src/modules/payments/helpers/wallet', () => ({ creditInstructorWallet: jest.fn() }));
jest.mock('../src/modules/classes/class.service', () => ({ getClassById: jest.fn() }));
jest.mock('../src/modules/books/book.service', () => ({ getBookById: jest.fn() }));
jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({ getTutorialById: jest.fn() }));
jest.mock('../src/modules/plans/subscription.helper', () => ({ getActiveStudentPlanId: jest.fn().mockResolvedValue(null) }));
jest.mock('../src/modules/invoices/invoices.service', () => ({ generateFromPayment: jest.fn() }));
jest.mock('../src/modules/payments/paymentAccess', () => ({ grantAccess: jest.fn() }));

const fs = require('fs');
const path = require('path');

const paymentsController = require('../src/modules/payments/payments.controller');
const bankController = require('../src/modules/payments/bank.controller');

const path = require('path');
const invoiceService = require('../src/modules/invoices/invoices.service');
const mailService = require('../src/services/mailService');
const bankController = require('../src/modules/payments/bank.controller');
const paymentsService = require('../src/modules/payments/payments.service');
const paymentMethodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const paymentConfigService = require('../src/modules/paymentConfig/paymentConfig.service');
const userModel = require('../src/modules/users/user.model');
const bookService = require('../src/modules/books/book.service');
const invoiceService = require('../src/modules/invoices/invoices.service');
const mailService = require('../src/services/mailService');
const plansService = require('../src/modules/plans/plans.service');
const subscriptionService = require('../src/modules/subscriptions/subscription.service');
const notificationService = require('../src/modules/notifications/notifications.service');
const { resolveInvoicePdfPath } = require('../src/modules/invoices/helpers/invoicePath');
const { creditInstructorWallet } = require('../src/modules/payments/helpers/wallet');

const TEST_INVOICE_URL = '/uploads/invoices/test-invoice.pdf';

beforeEach(() => {
  jest.clearAllMocks();
  invoiceService.generateFromPayment.mockResolvedValue({ pdf_url: TEST_INVOICE_URL });
  mailService.sendMail.mockResolvedValue();
  paymentConfigService.getSettings.mockResolvedValue({ platformCut: {} });
  userModel.findById.mockResolvedValue({ id: 'u1', email: 'u@test.com', full_name: 'User' });
  bookService.getBookById.mockResolvedValue({ price: 100, instructor_id: 'i1' });
  paymentsService.approveBankPayment.mockResolvedValue({ id: 'p3', user_id: 'u1', item_type: 'book', item_id: 'b1', instructor_amount: 90 });

  const absoluteInvoicePath = resolveInvoicePdfPath(TEST_INVOICE_URL);
  fs.mkdirSync(path.dirname(absoluteInvoicePath), { recursive: true });
  fs.writeFileSync(absoluteInvoicePath, 'test');
});

afterEach(() => {
  const absoluteInvoicePath = resolveInvoicePdfPath(TEST_INVOICE_URL);
  if (absoluteInvoicePath && fs.existsSync(absoluteInvoicePath)) {
    fs.unlinkSync(absoluteInvoicePath);
  }
});

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

async function waitForMailCall() {
  for (let i = 0; i < 10; i += 1) {
    if (mailService.sendMail.mock.calls.length > 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('invoice email dispatch', () => {
  it('sends invoice email for card payments', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'm1', type: 'card', active: true });
    paymentsService.create.mockResolvedValue({ id: 'p1', user_id: 'u1', method_id: 'm1', item_type: 'book', item_id: 'b1', amount: 100, currency: 'USD', status: 'paid' });

    const req = { body: { method_id: 'm1', item_type: 'book', item_id: 'b1', amount: 100, status: 'paid' }, user: { id: 'u1' } };
    const res = mockRes();
    const next = jest.fn();
    await paymentsController.createPayment(req, res, next);
    await new Promise(process.nextTick);
    await waitForMailCall();

    expect(next).not.toHaveBeenCalled();
    expect(invoiceService.generateFromPayment).toHaveBeenCalled();
    const expectedPath = resolveInvoicePdfPath(TEST_INVOICE_URL);
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@test.com', attachments: [{ path: expectedPath }] }));
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  it('sends invoice email for zero-amount payments', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'm2', type: 'free', active: true });
    bookService.getBookById.mockResolvedValue({ price: 0, instructor_id: 'i1' });
    paymentsService.create.mockResolvedValue({ id: 'p2', user_id: 'u1', method_id: 'm2', item_type: 'book', item_id: 'b1', amount: 0, currency: 'USD', status: 'paid' });

    const req = { body: { method_id: 'm2', item_type: 'book', item_id: 'b1', amount: 0, status: 'paid' }, user: { id: 'u1' } };
    const res = mockRes();
    await paymentsController.createPayment(req, res, () => {});
    await new Promise(process.nextTick);
    await waitForMailCall();

    expect(paymentsService.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 0, status: 'paid' }));
    const expectedPath = resolveInvoicePdfPath(TEST_INVOICE_URL);
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@test.com', attachments: [{ path: expectedPath }] }));
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  it('sends invoice email for bank payments upon approval', async () => {
    const req = { params: { id: 'p3' }, body: {}, user: { id: 'admin1' } };
    const res = mockRes();
    await bankController.approveBankPayment(req, res, () => {});
    await new Promise(process.nextTick);
    await waitForMailCall();

    const expectedPath = resolveInvoicePdfPath(TEST_INVOICE_URL);
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@test.com', attachments: [{ path: expectedPath }] }));
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  it('handles zero-amount payments without a method', async () => {
    bookService.getBookById.mockResolvedValue({ price: 0, instructor_id: 'i1' });
    paymentMethodsService.getByType.mockResolvedValue({ id: 'free', type: 'free', active: true });
    paymentsService.create.mockResolvedValue({ id: 'p4', user_id: 'u1', method_id: 'free', item_type: 'book', item_id: 'b1', amount: 0, currency: 'USD', status: 'paid' });

    const req = { body: { item_type: 'book', item_id: 'b1', amount: 0 }, user: { id: 'u1' } };
    const res = mockRes();
    await paymentsController.createPayment(req, res, () => {});
    await new Promise(process.nextTick);
    await waitForMailCall();

    expect(paymentMethodsService.getByType).toHaveBeenCalledWith('free');
    expect(paymentsService.create).toHaveBeenCalled();
    expect(paymentsService.create.mock.calls[0][0].status).toBe('paid');
    expect(creditInstructorWallet).toHaveBeenCalledWith('book', 'b1', 0);
    const expectedPath = resolveInvoicePdfPath(TEST_INVOICE_URL);
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@test.com', attachments: [{ path: expectedPath }] }));
    expect(fs.existsSync(expectedPath)).toBe(true);
  });
});

describe('bank payment invoice email', () => {
  it('attaches invoices using filesystem path on approval', async () => {
    const req = { params: { id: 'p3' }, body: {}, user: { id: 'admin1' } };
    const res = mockRes();
    const next = jest.fn();

    await bankController.approveBankPayment(req, res, next);
    expect(next).not.toHaveBeenCalled();
    await new Promise(process.nextTick);

    const expectedPath = path.join(__dirname, '../uploads/invoices/inv.pdf');
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u@test.com',
        attachments: [{ path: expectedPath }],
      })
    );
  });
});
