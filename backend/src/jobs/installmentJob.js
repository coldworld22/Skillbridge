const scheduleService = require("../modules/payments/paymentSchedule.service");
const notificationService = require("../modules/notifications/notifications.service");

async function processDueInstallments() {
  const due = await scheduleService.getDue();
  for (const inst of due) {
    await scheduleService.markPaid(inst.id);
    await notificationService.createNotification({
      user_id: inst.user_id,
      type: "installment_paid",
      message: `Installment ${inst.installment_number} charged`,
    });
  }
}

function startInstallmentJob() {
  setInterval(processDueInstallments, 24 * 60 * 60 * 1000); // daily
}

module.exports = { startInstallmentJob, processDueInstallments };
