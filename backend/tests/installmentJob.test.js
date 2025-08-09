jest.mock('../src/modules/payments/paymentSchedule.service', () => ({
  getDue: jest.fn(),
  markPaid: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

const scheduleService = require('../src/modules/payments/paymentSchedule.service');
const notificationService = require('../src/modules/notifications/notifications.service');
const { processDueInstallments } = require('../src/jobs/installmentJob');

describe('installment job', () => {
  it('charges due installments and notifies users', async () => {
    scheduleService.getDue.mockResolvedValue([{ id: '1', user_id: 'u1', installment_number: 2 }]);
    await processDueInstallments();
    expect(scheduleService.markPaid).toHaveBeenCalledWith('1');
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1' })
    );
  });
});
