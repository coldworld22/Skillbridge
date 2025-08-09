const mockLessons = [
  {
    id: 1,
    class_id: 42,
    title: 'Lesson A',
    start_time: new Date().toISOString(),
    class_title: 'Class A',
    instructor_id: 7,
  },
];

jest.mock('../../../../config/database', () => {
  const fn = jest.fn(() => fn);
  fn.join = jest.fn(() => fn);
  fn.select = jest.fn(() => fn);
  fn.whereBetween = jest.fn(() => Promise.resolve(mockLessons));
  return fn;
});

jest.mock('../../../../modules/users/user.model', () => ({
  findAdmins: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../../../modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../../../../modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../../../../utils/email', () => ({
  sendLessonReminderEmail: jest.fn(),
}));

jest.mock('../../enrollments/classEnrollment.service', () => ({
  getPhonesByClass: jest.fn(),
}));

jest.mock('../../../../services/smsService', () => ({
  sendSMS: jest.fn(),
}));

const smsService = require('../../../../services/smsService');
const enrollmentService = require('../../enrollments/classEnrollment.service');
const userModel = require('../../../../modules/users/user.model');
const startLessonReminderJob = require('../../../../jobs/lessonReminderJob');

describe('lessonReminderJob SMS', () => {
  it('sends SMS to instructor and enrolled students', async () => {
    userModel.findAdmins.mockResolvedValue([{ id: 99 }]);
    userModel.findById.mockResolvedValue({ id: 7, email: 'instr@example.com', phone: '+333' });
    enrollmentService.getPhonesByClass.mockResolvedValue([
      { id: 2, phone: '+111' },
      { id: 3, phone: '+222' },
    ]);

    let intervalFn;
    jest.spyOn(global, 'setInterval').mockImplementation((cb) => {
      intervalFn = cb;
      return 0;
    });

    startLessonReminderJob();
    await intervalFn();

    expect(smsService.sendSMS).toHaveBeenCalledWith({
      to: '+333',
      text: expect.stringContaining('Lesson "Lesson A" starts at'),
    });
    expect(smsService.sendSMS).toHaveBeenCalledWith({ to: '+111', text: expect.any(String) });
    expect(smsService.sendSMS).toHaveBeenCalledWith({ to: '+222', text: expect.any(String) });
    expect(smsService.sendSMS).toHaveBeenCalledTimes(3);
  });
});
