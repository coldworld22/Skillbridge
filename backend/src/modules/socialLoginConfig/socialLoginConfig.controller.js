const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./socialLoginConfig.service");
const { initStrategies } = require("../../config/passport");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

// Determine if the current user has admin-level access
const isAdminRole = (roles = []) => {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => r.toLowerCase().replace(/\s+/g, ""))
    .some((r) => ["admin", "superadmin"].includes(r));
};

// Remove secrets from the returned settings for non-admin requests
const sanitize = (settings, req) => {
  if (isAdminRole(req.user?.roles || req.user?.role)) return settings;
  const cloned = JSON.parse(JSON.stringify(settings || {}));

  if (cloned.providers) {
    for (const key of Object.keys(cloned.providers)) {
      delete cloned.providers[key]?.clientSecret;
    }
  }
  if (cloned.recaptcha) {
    delete cloned.recaptcha.secretKey;
  }
  return cloned;
};

exports.getSettings = catchAsync(async (req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, sanitize(settings || {}, req));
});

exports.updateSettings = catchAsync(async (req, res) => {
  const settings = await service.updateSettings(req.body);
  try {
    await initStrategies();
  } catch (err) {
    logger.error("Failed to reinitialize passport strategies", err);
  }
  sendSuccess(res, sanitize(settings, req), "Settings updated");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: "social_login_settings_updated",
          message: "Social login settings were updated",
        }),
        messageService.createMessage({
          sender_id: senderId || admin.id,
          receiver_id: admin.id,
          message: "Social login settings were updated",
        }),
      ])
    )
  );
});
