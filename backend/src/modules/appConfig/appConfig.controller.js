const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const fs = require("fs");
const path = require("path");
const service = require("./appConfig.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const { subtractStorageUsage } = require("../../middleware/storage");

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
      ]),
    ),
  );
});

exports.uploadLogo = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const existing = await service.getSettings();
  if (existing.logo_url) {
    const oldPath = path.join(__dirname, "../../../", existing.logo_url);
    if (fs.existsSync(oldPath)) {
      const oldSize = fs.statSync(oldPath)?.size || 0;
      fs.unlinkSync(oldPath);
      if (req.tenant?.id && oldSize > 0) {
        await subtractStorageUsage(req.tenant.id, oldSize);
      }
    }
  }
  const logoUrl = `/uploads/app/${req.file.filename}`;
  const updated = await service.updateSettings({
    ...existing,
    logo_url: logoUrl,
  });
  sendSuccess(res, updated, "Logo updated");
});
exports.uploadFavicon = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const existing = await service.getSettings();
  if (existing.favicon_url) {
    const oldPath = path.join(__dirname, "../../../", existing.favicon_url);
    if (fs.existsSync(oldPath)) {
      const oldSize = fs.statSync(oldPath)?.size || 0;
      fs.unlinkSync(oldPath);
      if (req.tenant?.id && oldSize > 0) {
        await subtractStorageUsage(req.tenant.id, oldSize);
      }
    }
  }
  const iconUrl = `/uploads/app/${req.file.filename}`;
  const updated = await service.updateSettings({
    ...existing,
    favicon_url: iconUrl,
  });
  sendSuccess(res, updated, "Favicon updated");
});

exports.uploadHomeBackground = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const existing = await service.getSettings();
  if (existing.home_bg_url) {
    const oldPath = path.join(__dirname, "../../../", existing.home_bg_url);
    if (fs.existsSync(oldPath)) {
      const oldSize = fs.statSync(oldPath)?.size || 0;
      fs.unlinkSync(oldPath);
      if (req.tenant?.id && oldSize > 0) {
        await subtractStorageUsage(req.tenant.id, oldSize);
      }
    }
  }
  const bgUrl = `/uploads/app/${req.file.filename}`;
  const updated = await service.updateSettings({
    ...existing,
    home_bg_url: bgUrl,
  });
  sendSuccess(res, updated, "Background updated");
});
