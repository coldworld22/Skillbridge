jest.mock('../payments.service', () => ({
  getById: jest.fn(async (id) => ({ id, user_id: 'u1', item_type: 'book', item_id: 10, status: 'awaiting_approval', amount: 9.99 })),
  update: jest.fn(async (id, data) => ({ id, user_id: 'u1', item_type: 'book', item_id: 10, amount: 9.99, ...data })),
  STATUS: { PAID: 'paid', AWAITING_APPROVAL: 'awaiting_approval', REJECTED: 'rejected' },
}));

jest.mock('../paymentAccess', () => ({
  grantAccess: jest.fn(async () => undefined),
}));

jest.mock('../helpers/wallet', () => ({
  creditInstructorFromPayment: jest.fn(async () => undefined),
}));

jest.mock('../../users/user.model', () => ({
  findById: jest.fn(async () => ({ id: 'u1', email: 's@example.com', invoice_email_opt_out: true })),
}));

jest.mock('../../invoices/invoices.service', () => ({
  generateFromPayment: jest.fn(async () => ({ id: 'inv1', pdf_url: null })),
}));

jest.mock('../../../services/mailService', () => ({
  sendMail: jest.fn(async () => undefined),
}));

jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(async () => undefined),
}));

const controller = require('../payments.controller');


describe('payments.controller.updatePayment (admin approve)', () => {
  test('grants access when status set to PAID', async () => {
    const req = { params: { id: 'p1' }, body: { status: 'paid' } };
    const json = jest.fn();
    const res = { status: jest.fn(() => res), json };
    const sendSuccess = require('../../../utils/response').sendSuccess;
    const grantAccess = require('../paymentAccess').grantAccess;

    controller.updatePayment(req, res, (e) => { throw e; });
    await new Promise((r) => setImmediate(r));

    expect(sendSuccess).toBeDefined();
    expect(grantAccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', status: 'paid' }));
  });
});
