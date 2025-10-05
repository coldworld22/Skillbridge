jest.mock('../src/modules/classes/class.service', () => ({
  getClassesStartingBetween: jest.fn(),
}));

jest.mock('../src/modules/classes/notifications/classNotification.service', () => ({
  getSubscribedStudentsByClass: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendClassReminderEmail: jest.fn(),
}));

const classService = require('../src/modules/classes/class.service');
const notificationService = require('../src/modules/classes/notifications/classNotification.service');
const smsService = require('../src/services/smsService');
const { sendClassReminderEmail } = require('../src/utils/email');
const startClassReminderJob = require('../src/jobs/classReminderJob');

describe('classReminderJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'setInterval').mockImplementation((fn) => {
      fn();
      return 0;
    });
  });

  afterEach(() => {
    global.setInterval.mockRestore();
  });

  test('dispatches email and sms only to subscribed students', async () => {
    const cls = { id: 1, title: 'Math', start_date: '2023-01-01T00:00:00Z' };
    const subscribedStudent = { email: 's@example.com', phone: '123', locale: 'en-US' };
    classService.getClassesStartingBetween.mockResolvedValue([cls]);
    notificationService.getSubscribedStudentsByClass.mockResolvedValue([subscribedStudent]);

    startClassReminderJob();
    await new Promise(setImmediate);

    expect(classService.getClassesStartingBetween).toHaveBeenCalled();
    expect(notificationService.getSubscribedStudentsByClass).toHaveBeenCalledWith(cls.id);
    expect(smsService.sendSMS).toHaveBeenCalledWith({
      to: '123',
      text: expect.stringContaining('Reminder'),
    });
    expect(sendClassReminderEmail).toHaveBeenCalledWith(
      's@example.com',
      'Math',
      cls.start_date,
      'en-US'
    );
  });

  test('skips sending reminders when no students are subscribed', async () => {
    const cls = { id: 1, title: 'Math', start_date: '2023-01-01T00:00:00Z' };
    classService.getClassesStartingBetween.mockResolvedValue([cls]);
    notificationService.getSubscribedStudentsByClass.mockResolvedValue([]);

    startClassReminderJob();
    await new Promise(setImmediate);

    expect(smsService.sendSMS).not.toHaveBeenCalled();
    expect(sendClassReminderEmail).not.toHaveBeenCalled();
  });
});

