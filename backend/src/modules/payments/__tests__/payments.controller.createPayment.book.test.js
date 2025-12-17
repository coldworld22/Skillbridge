jest.mock('../payments.service', () => ({
  create: jest.fn(async (data) => data),
  STATUS: { PAID: 'paid', PENDING_PAYMENT: 'pending_payment' },
}));

jest.mock('../helpers/validation', () => ({
  validatePaymentData: jest.fn(async () => ({
    method: { id: 'free', type: 'free' },
    verifiedAmount: 0,
    verifiedCurrency: 'USD',
    finalStatus: 'paid',
    verifiedReference: null,
    planInterval: null,
    schedules: [],
    next_due_date: null,
    totalInstallments: 1,
    subscriptionPlanId: null,
  })),
}));

jest.mock('../../library/library.service', () => ({
  recordPurchase: jest.fn(async () => ({ id: 1 })),
}));

jest.mock('../../paymentMethods/paymentMethods.service', () => ({
  getByType: jest.fn(async () => ({ id: 'free', type: 'free', active: true })),
}));

jest.mock('../../users/user.model', () => ({
  findById: jest.fn(async () => ({ id: 'u1' })),
}));

jest.mock('../../../services/smsService', () => ({ sendSMS: jest.fn(async () => undefined) }));
jest.mock('../../../services/mailService', () => ({ sendMail: jest.fn(async () => undefined) }));
jest.mock('../helpers/wallet', () => ({ creditInstructorWallet: jest.fn(async () => undefined) }));
jest.mock('../helpers/enrollment', () => ({ handleEnrollment: jest.fn(async () => undefined) }));

const controller = require('../payments.controller');
const library = require('../../library/library.service');

describe('payments.controller.createPayment - book immediate paid', () => {
  test('records book purchase in library when paid', async () => {
    const req = { user: { id: 'u1' }, body: { item_type: 'book', item_id: 5, amount: 0 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    controller.createPayment(req, res, (e) => { throw e; });
    await new Promise((r) => setImmediate(r));
    expect(library.recordPurchase).toHaveBeenCalledWith('u1', 5, 0);
  });
});

