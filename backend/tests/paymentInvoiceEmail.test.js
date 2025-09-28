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
jest.mock('../src/modules/classes/class.service', () => ({ getClassById: jest.fn() }));
jest.mock('../src/modules/books/book.service', () => ({ getBookById: jest.fn() }));
jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({ getTutorialById: jest.fn() }));
jest.mock('../src/modules/invoices/invoices.service', () => {
  const actual = jest.requireActual('../src/modules/invoices/invoices.service');
  return { ...actual, generateFromPayment: jest.fn() };
});
jest.mock('../src/modules/payments/paymentAccess', () => ({ grantAccess: jest.fn() }));

process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://user:pass@localhost:5432/test';

const path = require('path');
const invoiceService = require('../src/modules/invoices/invoices.service');
const mailService = require('../src/services/mailService');
const bankController = require('../src/modules/payments/bank.controller');
const paymentsService = require('../src/modules/payments/payments.service');
const paymentMethodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const paymentConfigService = require('../src/modules/paymentConfig/paymentConfig.service');
const userModel = require('../src/modules/users/user.model');

beforeEach(() => {
  jest.clearAllMocks();
  invoiceService.generateFromPayment.mockResolvedValue({ pdf_url: '/uploads/invoices/inv.pdf' });
  mailService.sendMail.mockResolvedValue();
  paymentConfigService.getSettings.mockResolvedValue({ platformCut: {} });
  userModel.findById.mockResolvedValue({ id: 'u1', email: 'u@test.com', full_name: 'User' });
  userModel.findAdmins.mockResolvedValue([{ email: 'admin@test.com' }]);
  paymentsService.approveBankPayment.mockResolvedValue({
    id: 'p3',
    user_id: 'u1',
    item_type: 'book',
    item_id: 'b1',
    instructor_amount: 90,
  });
});

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('invoice file helpers', () => {
  it('normalizes file names into public and absolute paths', () => {
    const info = invoiceService.getInvoiceFilePaths('demo.pdf');
    expect(info.publicUrl).toBe('/uploads/invoices/demo.pdf');
    expect(info.absolutePath).toBe(path.join(__dirname, '../uploads/invoices/demo.pdf'));
  });

  it('keeps existing public url while resolving absolute path', () => {
    const info = invoiceService.getInvoiceFilePaths('/uploads/invoices/existing.pdf');
    expect(info.publicUrl).toBe('/uploads/invoices/existing.pdf');
    expect(info.absolutePath).toBe(path.join(__dirname, '../uploads/invoices/existing.pdf'));
  });

  it('prefers stored file_path when resolving attachment path', () => {
    const absolute = invoiceService.resolveInvoiceAttachmentPath({
      pdf_url: '/uploads/invoices/file.pdf',
      file_path: '/tmp/custom/file.pdf',
    });
    expect(absolute).toBe('/tmp/custom/file.pdf');
  });

  it('falls back to derived path when file_path is missing', () => {
    const absolute = invoiceService.resolveInvoiceAttachmentPath({ pdf_url: '/uploads/invoices/file.pdf' });
    expect(absolute).toBe(path.join(__dirname, '../uploads/invoices/file.pdf'));
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
