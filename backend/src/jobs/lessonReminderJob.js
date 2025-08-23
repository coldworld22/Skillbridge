const logger = require('../utils/logger.js');
const db = require("../config/database");
const notificationService = require("../modules/notifications/notifications.service");
const messageService = require("../modules/messages/messages.service");
const userModel = require("../modules/users/user.model");
const enrollmentService = require("../modules/classes/enrollments/classEnrollment.service");
const smsService = require("../services/smsService");
const { sendLessonReminderEmail } = require("../utils/email");

function startLessonReminderJob() {
  setInterval(async () => {
    const now = new Date();
    const startWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    try {
      const lessons = await db("class_lessons as l")
        .join("online_classes as c", "l.class_id", "c.id")
        .select(
          "l.id",
          "l.class_id",
          "l.title",
          "l.start_time",
          "c.title as class_title",
          "c.instructor_id"
        )
        .whereBetween("l.start_time", [startWindow, endWindow]);

      if (!lessons.length) return;

      const admins = await userModel.findAdmins();
      const sender = admins[0];

      for (const lesson of lessons) {
        const instructor = await userModel.findById(lesson.instructor_id);
        if (!instructor) continue;
        const message = `Reminder: Lesson "${lesson.title}" starts at ${lesson.start_time}`;
        await notificationService.createNotification({
          user_id: instructor.id,
          type: "lesson_reminder",
          message,
        });
        if (sender) {
          await messageService.createMessage({
            sender_id: sender.id,
            receiver_id: instructor.id,
            message,
          });
        }
        try {
          await sendLessonReminderEmail(
            instructor.email,
            lesson.title,
            lesson.start_time,
            lesson.class_title
          );
        } catch (err) {
          logger.error("Error sending reminder email:", err.message);
        }

        const startTime = new Date(lesson.start_time).toLocaleString();
        const text = `Reminder: Lesson "${lesson.title}" starts at ${startTime}`;

        if (instructor.phone) {
          try {
            await smsService.sendSMS({ to: instructor.phone, text });
          } catch (err) {
            logger.error("Error sending instructor reminder SMS:", err.message);
          }
        }

        let students = [];
        try {
          students = await enrollmentService.getPhonesByClass(lesson.class_id);
        } catch (err) {
          logger.error("Error fetching enrolled students for lesson:", err.message);
        }
        for (const student of students) {
          try {
            await smsService.sendSMS({ to: student.phone, text });
          } catch (err) {
            logger.error("Error sending lesson reminder SMS:", err.message);
          }
        }
      }
    } catch (err) {
      logger.error("Lesson reminder job error:", err.message);
    }
  }, 60 * 60 * 1000); // run hourly
}

module.exports = startLessonReminderJob;
