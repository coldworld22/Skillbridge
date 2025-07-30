const cartService = require("../modules/cart/cart.service");
const notificationService = require("../modules/notifications/notifications.service");
const messageService = require("../modules/messages/messages.service");
const userModel = require("../modules/users/user.model");
const { sendCartReminderEmail } = require("../utils/email");

function startCartReminderJob() {
  setInterval(async () => {
    const items = cartService.getAll();
    const now = Date.now();
    const admins = await userModel.findAdmins();
    const sender = admins[0];
    for (const item of items) {
      if (item.reminder_sent) continue;
      const added = new Date(item.added_at).getTime();
      if (now - added >= 4 * 60 * 60 * 1000) {
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
          console.error("Error sending cart reminder email:", err.message);
        }
        item.reminder_sent = true;
      }
    }
  }, 60 * 60 * 1000); // hourly
}

module.exports = startCartReminderJob;
