const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const fs = require("fs");
const path = require("path");
const service = require("./appConfig.service");
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
  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: "app_settings_updated",
          message: "Application settings were updated",
        }),
        messageService.createMessage({
          sender_id: senderId || admin.id,
          receiver_id: admin.id,
          message: "Application settings were updated",
        }),
      ])
    )
  );
});

exports.uploadLogo = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const existing = await service.getSettings();
  if (existing.logo_url) {
    const oldPath = path.join(__dirname, "../../../", existing.logo_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  const logoUrl = `/uploads/app/${req.file.filename}`;
  const updated = await service.updateSettings({ ...existing, logo_url: logoUrl });
  sendSuccess(res, updated, "Logo updated");
});
exports.uploadFavicon = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const existing = await service.getSettings();
  if (existing.favicon_url) {
    const oldPath = path.join(__dirname, "../../../", existing.favicon_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  const iconUrl = `/uploads/app/${req.file.filename}`;
  const updated = await service.updateSettings({ ...existing, favicon_url: iconUrl });
  sendSuccess(res, updated, "Favicon updated");
});

