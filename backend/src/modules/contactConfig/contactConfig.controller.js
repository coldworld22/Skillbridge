const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./contactConfig.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

exports.getSettings = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, settings || {});
});

exports.updateSettings = catchAsync(async (req, res) => {
  const settings = await service.updateSettings(req.body);
  sendSuccess(res, settings, "Settings updated");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  Promise.allSettled(
    admins.flatMap((admin) => [
      notificationService.createNotification({
        user_id: admin.id,
        type: "contact_settings_updated",
        message: "Contact settings were updated",
      }),
      messageService.createMessage({
        sender_id: senderId || admin.id,
        receiver_id: admin.id,
        message: "Contact settings were updated",
      }),
    ])
  ).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") {
        logger.error(
          "Failed to dispatch contact settings update notification:",
          r.reason?.message || r.reason
        );
      }
    });
  });
});
