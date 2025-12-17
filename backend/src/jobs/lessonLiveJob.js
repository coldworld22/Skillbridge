const logger = require('../utils/logger.js');
const classLessonService = require('../modules/classes/lessons/classLesson.service');
const enrollmentService = require('../modules/classes/enrollments/classEnrollment.service');
const userModel = require('../modules/users/user.model');
const notificationService = require('../modules/notifications/notifications.service');
const smsService = require('../services/smsService');
const { sendLessonReminderEmail } = require('../utils/email');
const { createLessonRoomLink } = require('../utils/roomLink');

const sent = new Set();

async function processLessons() {
  const now = new Date();
  const end = new Date(now.getTime() + 5 * 60 * 1000);
  try {
    const lessons = await classLessonService.getLessonsStartingBetween(now, end);
    for (const lesson of lessons) {
      if (sent.has(lesson.id)) continue;
      const { url } = createLessonRoomLink(lesson.id);
      const message = `Your lesson "${lesson.title}" is starting soon. Join: ${url}`;
      const instructor = await userModel.findById(lesson.instructor_id);
      if (instructor) {
        await notificationService.createNotification({
          user_id: instructor.id,
          type: 'lesson_live',
          message,
        });
        if (instructor.phone) {
          await smsService.sendSMS({ to: instructor.phone, text: message });
        }
        try {
          await sendLessonReminderEmail(
            instructor.email,
            lesson.title,
            lesson.start_time,
            lesson.class_title + `\nJoin: ${url}`
          );
        } catch (err) {
          logger.error('Failed to send lesson live email', err.message);
        }
      }
      const students = await enrollmentService.getByClass(lesson.class_id);
      for (const student of students) {
        await notificationService.createNotification({
          user_id: student.id,
          type: 'lesson_live',
          message,
        });
        if (student.phone) {
          await smsService.sendSMS({ to: student.phone, text: message });
        }
        if (student.email) {
          try {
            await sendLessonReminderEmail(
              student.email,
              lesson.title,
              lesson.start_time,
              lesson.class_title + `\nJoin: ${url}`
            );
          } catch (err) {
            logger.error('Failed to send lesson live email', err.message);
          }
        }
      }
      sent.add(lesson.id);
    }
  } catch (err) {
    logger.error('Lesson live job error:', err.message);
  }
}

function startLessonLiveJob() {
  setInterval(processLessons, 60 * 1000); // run every minute
}

module.exports = { startLessonLiveJob, processLessons };
