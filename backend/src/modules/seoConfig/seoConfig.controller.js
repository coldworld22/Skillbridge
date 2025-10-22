const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./seoConfig.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const AppError = require("../../utils/AppError");

exports.getSettings = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, settings || {});
});

exports.updateSettings = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  if (
    payload.globalSEO &&
    Object.prototype.hasOwnProperty.call(
      payload.globalSEO,
      "nofollowSitewide"
    )
  ) {
    payload.globalSEO.nofollowSitewide = !!payload.globalSEO.nofollowSitewide;
  }
  const settings = await service.updateSettings(payload);
  sendSuccess(res, settings, "Settings updated");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: "seo_settings_updated",
          message: "SEO settings were updated",
        }),
        messageService.createMessage({
          sender_id: senderId || admin.id,
          receiver_id: admin.id,
          message: "SEO settings were updated",
        }),
      ])
    )
  );
});

exports.regenerateSitemap = catchAsync(async (_req, res) => {
  const result = await service.generateSitemap();
  sendSuccess(res, result, "Sitemap regenerated");
});

exports.scanMetaIssues = catchAsync(async (_req, res) => {
  const result = await service.scanMetaIssues();
  sendSuccess(res, result, "Scan complete");
});

exports.listPages = catchAsync(async (_req, res) => {
  const pages = await service.listPages();
  sendSuccess(res, pages);
});

exports.uploadImage = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const url = `/uploads/seo/${req.file.filename}`;
  sendSuccess(res, { url }, "Image uploaded");
});
