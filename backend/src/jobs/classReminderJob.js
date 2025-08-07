const classService = require("../modules/classes/class.service");
const enrollmentService = require("../modules/classes/enrollments/classEnrollment.service");
const smsService = require("../services/smsService");

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
          if (!student.phone) continue;
          const startTime = new Date(cls.start_date).toLocaleString();
          const text = `Reminder: ${cls.title} starts at ${startTime}`;
          try {
            await smsService.sendSMS({ to: student.phone, text });
          } catch (err) {
            console.error("Error sending class reminder SMS:", err.message);
          }
        }
      }
    } catch (err) {
      console.error("Class reminder job error:", err.message);
    }
  }, 60 * 60 * 1000); // hourly
}

module.exports = startClassReminderJob;
