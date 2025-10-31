const scheduleService = require("../modules/payments/paymentSchedule.service");
const notificationService = require("../modules/notifications/notifications.service");
const userModel = require("../modules/users/user.model");
const classEnrollmentService = require("../modules/classes/enrollments/classEnrollment.service");
const logger = require("../utils/logger.js");

async function processDueInstallments() {
  const due = await scheduleService.getDue();
  if (!due.length) return;

  let admins = [];
  try {
    admins = await userModel.findAdmins();
  } catch (err) {
    logger.error("Failed to load admins for installment notifications:", err.message);
  }

  for (const inst of due) {
    const installmentLabel = `Installment ${inst.installment_number}`;
    const classTitle = inst.class_title || "online class";
    const studentName = inst.student_name || inst.user_id;
    const studentMessage = `${installmentLabel} for "${classTitle}" is now due. Please complete your remaining payment.`;
    const instructorMessage = `${installmentLabel} for "${classTitle}" for student ${studentName} is due.`;
    const adminMessage = `${installmentLabel} for "${classTitle}" is due for student ${studentName}.`;

    try {
      await notificationService.createNotification({
        user_id: inst.user_id,
        type: "installment_due",
        message: studentMessage,
      });
    } catch (err) {
      logger.error("Failed to notify student about installment:", err.message);
    }

    if (inst.instructor_id) {
      try {
        await notificationService.createNotification({
          user_id: inst.instructor_id,
          type: "installment_due_instructor",
          message: instructorMessage,
        });
      } catch (err) {
        logger.error("Failed to notify instructor about installment:", err.message);
      }
    }

    if (admins.length) {
      const notifications = admins.map((admin) =>
        notificationService.createNotification({
          user_id: admin.id,
          type: "installment_due_admin",
          message: adminMessage,
        })
      );
      await Promise.allSettled(notifications);
    }

    try {
      await scheduleService.markAwaitingPayment(inst.id);
    } catch (err) {
      logger.error("Failed to update installment schedule status:", err.message);
    }

    if (inst.item_type === "class" && inst.item_id && inst.user_id) {
      try {
        const enrollment = await classEnrollmentService.findEnrollment(
          inst.user_id,
          inst.item_id
        );
        if (
          enrollment &&
          enrollment.status !== "suspended" &&
          enrollment.status !== "completed" &&
          enrollment.status !== "cancelled"
        ) {
          await classEnrollmentService.updateEnrollment(inst.user_id, inst.item_id, {
            status: "suspended",
          });
        }
      } catch (err) {
        logger.error("Failed to suspend enrollment for overdue installment:", err.message);
      }
    }
  }
}

function startInstallmentJob() {
  setInterval(processDueInstallments, 24 * 60 * 60 * 1000); // daily
}

module.exports = { startInstallmentJob, processDueInstallments };
