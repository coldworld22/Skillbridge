jest.mock('../src/modules/payments/payments.service', () => ({
  STATUS: { PAID: 'paid', AWAITING_APPROVAL: 'awaiting_approval', REJECTED: 'rejected' },
  create: jest.fn(),
  update: jest.fn(),
  approveBankPayment: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({ sendSMS: jest.fn() }));
jest.mock('../src/modules/users/user.model', () => ({ findById: jest.fn() }));
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
jest.mock('../src/modules/payments/helpers/planRevenue', () => ({ calculateInstructorAmount: jest.fn().mockResolvedValue(0) }));
jest.mock('../src/modules/classes/class.service', () => ({ getClassById: jest.fn() }));
jest.mock('../src/modules/books/book.service', () => ({ getBookById: jest.fn() }));
jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({ getTutorialById: jest.fn() }));
const path = require("path");

jest.mock('../src/modules/invoices/invoices.service', () => {
  const mockPath = require('path');
  const invoicesDir = mockPath.join(__dirname, '../src/modules/invoices');
  const buildAbsolutePath = (pdfUrl) => {
    if (!pdfUrl) return null;
    return mockPath.join(invoicesDir, '../../../', pdfUrl.replace(/^\//, ''));
  };
  const resolveInvoicePath = jest.fn((invoiceOrUrl) => {
    if (!invoiceOrUrl) return null;
    if (typeof invoiceOrUrl === 'string') {
      return buildAbsolutePath(invoiceOrUrl);
    }
    if (invoiceOrUrl.pdf_path) {
      return invoiceOrUrl.pdf_path;
    }
    return buildAbsolutePath(invoiceOrUrl.pdf_url);
  });
  return {
    generateFromPayment: jest.fn(),
    resolveInvoicePath,
  };
});
jest.mock('../src/modules/payments/paymentAccess', () => ({ grantAccess: jest.fn() }));

const paymentsController = require('../src/modules/payments/payments.controller');
const bankController = require('../src/modules/payments/bank.controller');

const paymentsService = require('../src/modules/payments/payments.service');
const paymentMethodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const paymentConfigService = require('../src/modules/paymentConfig/paymentConfig.service');
const userModel = require('../src/modules/users/user.model');
const bookService = require('../src/modules/books/book.service');
const invoiceService = require('../src/modules/invoices/invoices.service');
const mailService = require('../src/services/mailService');
const walletService = require('../src/modules/payouts/wallet.service');
const plansService = require('../src/modules/plans/plans.service');
const subscriptionService = require('../src/modules/subscriptions/subscription.service');
const notificationService = require('../src/modules/notifications/notifications.service');

beforeEach(() => {
  jest.clearAllMocks();
  invoiceService.generateFromPayment.mockResolvedValue({ pdf_url: '/inv.pdf' });
  const expectedAttachmentPath = invoiceService.resolveInvoicePath({ pdf_url: '/inv.pdf' });
  mailService.sendMail.mockImplementation((options = {}) => {
    const attachmentPath = options.attachments?.[0]?.path;
    if (attachmentPath) {
      expect(attachmentPath).toBe(expectedAttachmentPath);
      expect(path.isAbsolute(attachmentPath)).toBe(true);
    }
    return Promise.resolve();
  });
  paymentConfigService.getSettings.mockResolvedValue({ platformCut: {} });
  userModel.findById.mockResolvedValue({ id: 'u1', email: 'u@test.com', full_name: 'User' });
  bookService.getBookById.mockResolvedValue({ price: 100, instructor_id: 'i1' });
  paymentsService.approveBankPayment.mockResolvedValue({ id: 'p3', user_id: 'u1', item_type: 'book', item_id: 'b1', instructor_amount: 90 });
});

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('invoice email dispatch', () => {
  it('sends invoice email for card payments', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'm1', type: 'card', active: true });
    paymentsService.create.mockResolvedValue({ id: 'p1', user_id: 'u1', method_id: 'm1', item_type: 'book', item_id: 'b1', amount: 100, currency: 'USD', status: 'paid' });

    const req = { body: { method_id: 'm1', item_type: 'book', item_id: 'b1', amount: 100, status: 'paid' }, user: { id: 'u1' } };
    const res = mockRes();
    await paymentsController.createPayment(req, res, () => {});
    await new Promise(process.nextTick);

    const expectedAttachmentPath = invoiceService.resolveInvoicePath({ pdf_url: '/inv.pdf' });
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@test.com', attachments: [{ path: expectedAttachmentPath }] }));
  });

  it('resolves invoice attachment paths to an absolute filesystem location', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'mA', type: 'card', active: true });
    paymentsService.create.mockResolvedValue({ id: 'pA', user_id: 'u1', method_id: 'mA', item_type: 'book', item_id: 'b1', amount: 100, currency: 'USD', status: 'paid' });

    const req = { body: { method_id: 'mA', item_type: 'book', item_id: 'b1', amount: 100, status: 'paid' }, user: { id: 'u1' } };
    const res = mockRes();
    await paymentsController.createPayment(req, res, () => {});
    await new Promise(process.nextTick);

    const mailArgs = mailService.sendMail.mock.calls[0][0];
    const attachmentPath = mailArgs.attachments?.[0]?.path;
    expect(path.isAbsolute(attachmentPath)).toBe(true);
    await expect(mailService.sendMail.mock.results[0].value).resolves.toBeUndefined();
  });

  it('sends invoice email for zero-amount payments', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'm2', type: 'free', active: true });
    bookService.getBookById.mockResolvedValue({ price: 0, instructor_id: 'i1' });
    paymentsService.create.mockResolvedValue({ id: 'p2', user_id: 'u1', method_id: 'm2', item_type: 'book', item_id: 'b1', amount: 0, currency: 'USD', status: 'paid' });

    const req = { body: { method_id: 'm2', item_type: 'book', item_id: 'b1', amount: 0, status: 'paid' }, user: { id: 'u1' } };
    const res = mockRes();
    await paymentsController.createPayment(req, res, () => {});
    await new Promise(process.nextTick);

    expect(paymentsService.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 0, status: 'paid' }));
    const expectedAttachmentPath = invoiceService.resolveInvoicePath({ pdf_url: '/inv.pdf' });
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@test.com', attachments: [{ path: expectedAttachmentPath }] }));
  });

  it('sends invoice email for bank payments upon approval', async () => {
    const req = { params: { id: 'p3' }, body: {}, user: { id: 'admin1' } };
    const res = mockRes();
    await bankController.approveBankPayment(req, res, () => {});
    await new Promise(process.nextTick);

    const expectedAttachmentPath = invoiceService.resolveInvoicePath({ pdf_url: '/inv.pdf' });
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@test.com', attachments: [{ path: expectedAttachmentPath }] }));
  });

  it('handles zero-amount payments without a method', async () => {
    bookService.getBookById.mockResolvedValue({ price: 0, instructor_id: 'i1' });
    paymentMethodsService.getByType.mockResolvedValue({ id: 'free', type: 'free', active: true });
    paymentsService.create.mockResolvedValue({ id: 'p4', user_id: 'u1', method_id: 'free', item_type: 'book', item_id: 'b1', amount: 0, currency: 'USD', status: 'paid' });

    const req = { body: { item_type: 'book', item_id: 'b1', amount: 0 }, user: { id: 'u1' } };
    const res = mockRes();
    await paymentsController.createPayment(req, res, () => {});
    await new Promise(process.nextTick);

    expect(paymentMethodsService.getByType).toHaveBeenCalledWith('free');
    expect(paymentsService.create).toHaveBeenCalled();
    expect(paymentsService.create.mock.calls[0][0].status).toBe('paid');
    expect(walletService.increment).toHaveBeenCalledWith('i1', 0);
    const expectedAttachmentPath = invoiceService.resolveInvoicePath({ pdf_url: '/inv.pdf' });
    expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u@test.com', attachments: [{ path: expectedAttachmentPath }] }));
  });

  it('triggers notification for paid plan payments', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'm1', type: 'card', active: true });
    plansService.getPlanById.mockResolvedValue({ id: 'plan1', name: 'Gold', price_monthly: 100, price_yearly: 1000 });
    subscriptionService.createOrRenewSubscription.mockResolvedValue({ start_date: '2024-01-01', end_date: '2024-02-01' });
    paymentsService.create.mockResolvedValue({ id: 'p5', user_id: 'u1', method_id: 'm1', item_type: 'plan', item_id: 'plan1', amount: 100, currency: 'USD', status: 'paid' });

    const req = { body: { method_id: 'm1', item_type: 'plan', item_id: 'plan1', amount: 100, status: 'paid' }, user: { id: 'u1' } };
    const res = mockRes();
    await paymentsController.createPayment(req, res, () => {});
    await new Promise(process.nextTick);

    expect(subscriptionService.createOrRenewSubscription).toHaveBeenCalledWith({ user_id: 'u1', plan_id: 'plan1', interval: 'monthly' });
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', type: 'plan_subscription' })
    );
  });
});

