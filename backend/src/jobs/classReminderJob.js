const logger = require('../utils/logger.js');
const classService = require("../modules/classes/class.service");
const enrollmentService = require("../modules/classes/enrollments/classEnrollment.service");
const smsService = require("../services/smsService");
const { sendClassReminderEmail } = require("../utils/email");

function startClassReminderJob() {
  setInterval(async () => {
    const now = new Date();
    const startWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    try {
      const classes = await classService.getClassesStartingBetween(startWindow, endWindow);
      for (const cls of classes) {
        const students = await enrollmentService.getByClass(cls.id);
        for (const student of students) {
          const startTime = new Date(cls.start_date).toLocaleString();
          const text = `Reminder: ${cls.title} starts at ${startTime}`;
          if (student.phone) {
            try {
              await smsService.sendSMS({ to: student.phone, text });
            } catch (err) {
              logger.error("Error sending class reminder SMS:", err.message);
            }
          }
          if (student.email) {
            try {
              await sendClassReminderEmail(
                student.email,
                cls.title,
                cls.start_date,
                student.locale
              );
            } catch (err) {
              logger.error("Error sending class reminder email:", err.message);
            }
          }
        }
      }
    } catch (err) {
      logger.error("Class reminder job error:", err.message);
    }
  }, 60 * 60 * 1000); // hourly
}

module.exports = startClassReminderJob;
