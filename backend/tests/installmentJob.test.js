jest.mock('../src/modules/payments/paymentSchedule.service', () => ({
  getDue: jest.fn(),
  markPaid: jest.fn(),
  markAwaitingPayment: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn().mockResolvedValue([{ id: 'admin1' }]),
}));

jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({
  findEnrollment: jest.fn().mockResolvedValue({ status: 'enrolled' }),
  updateEnrollment: jest.fn().mockResolvedValue(1),
}));

jest.mock('../src/utils/logger.js', () => ({
  error: jest.fn(),
}));

const scheduleService = require('../src/modules/payments/paymentSchedule.service');
const notificationService = require('../src/modules/notifications/notifications.service');
const enrollmentService = require('../src/modules/classes/enrollments/classEnrollment.service');
const { processDueInstallments } = require('../src/jobs/installmentJob');

describe('installment job', () => {
  it('notifies stakeholders when installments are due and marks awaiting payment', async () => {
    scheduleService.getDue.mockResolvedValue([
      {
        id: '1',
        user_id: 'u1',
        item_type: 'class',
        item_id: 'class-1',
        installment_number: 2,
        class_title: 'Physics 101',
        instructor_id: 'inst1',
        student_name: 'Alice',
      },
    ]);
    await processDueInstallments();
    expect(scheduleService.markPaid).not.toHaveBeenCalled();
    expect(scheduleService.markAwaitingPayment).toHaveBeenCalledWith('1');
    expect(enrollmentService.findEnrollment).toHaveBeenCalledWith('u1', 'class-1');
    expect(enrollmentService.updateEnrollment).toHaveBeenCalledWith('u1', 'class-1', { status: 'suspended' });
    const calls = notificationService.createNotification.mock.calls;
    const recipientIds = calls.map((call) => call[0].user_id);
    expect(recipientIds).toEqual(expect.arrayContaining(['u1', 'inst1', 'admin1']));
  });
});
