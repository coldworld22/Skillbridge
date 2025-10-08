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
jest.mock('../src/modules/classes/class.service', () => ({ getClassById: jest.fn() }));
jest.mock('../src/modules/books/book.service', () => ({ getBookById: jest.fn() }));
jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({ getTutorialById: jest.fn() }));
jest.mock('../src/modules/invoices/invoices.service', () => ({ generateFromPayment: jest.fn() }));
jest.mock('../src/modules/payments/paymentAccess', () => ({ grantAccess: jest.fn() }));

const paymentsController = require('../src/modules/payments/payments.controller');
const paymentsService = require('../src/modules/payments/payments.service');
const paymentMethodsService = require('../src/modules/paymentMethods/paymentMethods.service');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('payment amount validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects zero amount with non-free method', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'm1', type: 'card', active: true });

    const req = { body: { method_id: 'm1', item_type: 'book', item_id: 'b1', amount: 0 }, user: { id: 'u1' } };
    const res = mockRes();
    const next = jest.fn();

    await paymentsController.createPayment(req, res, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.message).toBe('Invalid amount');
    expect(paymentsService.create).not.toHaveBeenCalled();
  });

  it('rejects negative amount with non-free method', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'm1', type: 'card', active: true });

    const req = { body: { method_id: 'm1', item_type: 'book', item_id: 'b1', amount: -10 }, user: { id: 'u1' } };
    const res = mockRes();
    const next = jest.fn();

    await paymentsController.createPayment(req, res, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.message).toBe('Invalid amount');
    expect(paymentsService.create).not.toHaveBeenCalled();
  });

  it('rejects bank payment via createPayment', async () => {
    paymentMethodsService.getById.mockResolvedValue({ id: 'm1', type: 'bank', active: true });

    const req = { body: { method_id: 'm1', item_type: 'book', item_id: 'b1', amount: 10 }, user: { id: 'u1' } };
    const res = mockRes();
    const next = jest.fn();

    await paymentsController.createPayment(req, res, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.message).toBe('Bank payments must use the bank transfer API');
    expect(paymentsService.create).not.toHaveBeenCalled();
  });
});
