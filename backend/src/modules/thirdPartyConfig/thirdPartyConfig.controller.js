const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./thirdPartyConfig.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

exports.getSettings = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, settings || {});
});

exports.updateSettings = catchAsync(async (req, res) => {
  const { recaptcha, ...rest } = req.body || {};
  const settings = await service.updateSettings(rest);
  sendSuccess(res, settings, "Settings updated");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  Promise.allSettled(
    admins.flatMap((admin) => [
      notificationService.createNotification({
        user_id: admin.id,
        type: "third_party_settings_updated",
        message: "Third-party integration settings were updated",
      }),
      messageService.createMessage({
        sender_id: senderId || admin.id,
        receiver_id: admin.id,
        message: "Third-party integration settings were updated",
      }),
    ])
  ).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") {
        logger.error(
          "Failed to dispatch third-party settings update notification:",
          r.reason?.message || r.reason
        );
      }
    });
  });
});
