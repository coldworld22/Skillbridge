const logger = require('../utils/logger.js');
const db = require("../config/database");
const notificationService = require("../modules/notifications/notifications.service");
const messageService = require("../modules/messages/messages.service");
const userModel = require("../modules/users/user.model");
const { sendCartReminderEmail } = require("../utils/email");

function startCartReminderJob() {
  setInterval(async () => {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const items = await db("cart_items")
      .where("reminder_sent", false)
      .andWhere("added_at", "<=", fourHoursAgo);
    const admins = await userModel.findAdmins();
    const sender = admins[0];
    for (const item of items) {
      const message = `Don't forget about ${item.name || "item"} in your cart!`;
      await notificationService.createNotification({
        user_id: item.user_id,
        type: "cart_reminder",
        message,
      });
      if (sender) {
        await messageService.createMessage({
          sender_id: sender.id,
          receiver_id: item.user_id,
          message,
        });
      }
      try {
        const user = await userModel.findById(item.user_id);
        if (user?.email) await sendCartReminderEmail(user.email, item.name);
      } catch (err) {
        logger.error("Error sending cart reminder email:", err.message);
      }
      await db("cart_items").where({ id: item.id }).update({ reminder_sent: true });
    }
  }, 60 * 60 * 1000); // hourly
}

module.exports = startCartReminderJob;
