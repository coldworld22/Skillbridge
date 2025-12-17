const { processLessons } = require('../src/jobs/lessonLiveJob');

jest.mock('../src/modules/classes/lessons/classLesson.service', () => ({
  getLessonsStartingBetween: jest.fn(() => [
    {
      id: 'lesson1',
      class_id: 'class1',
      title: 'Lesson 1',
      start_time: new Date().toISOString(),
      class_title: 'Test Class',
      instructor_id: 'inst1',
    },
  ]),
}));

jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({
  getByClass: jest.fn(() => [
    { id: 'stu1', email: 's1@test.com', phone: '222' },
  ]),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findById: jest.fn(() => ({ id: 'inst1', email: 'i@test.com', phone: '111' })),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendLessonReminderEmail: jest.fn(),
}));

jest.mock('../src/utils/roomLink', () => ({
  createLessonRoomLink: jest.fn(() => ({ url: 'http://room' })),
}));

describe('lesson live job', () => {
  it('sends notifications and generates link', async () => {
    await processLessons();
    const notif = require('../src/modules/notifications/notifications.service');
    const sms = require('../src/services/smsService');
    const email = require('../src/utils/email');
    const room = require('../src/utils/roomLink');
    expect(room.createLessonRoomLink).toHaveBeenCalledWith('lesson1');
    expect(notif.createNotification).toHaveBeenCalledTimes(2);
    expect(sms.sendSMS).toHaveBeenCalled();
    expect(email.sendLessonReminderEmail).toHaveBeenCalled();
  });
});
