const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const fs = require("fs");
const path = require("path");

const service = require("./appConfig.service");

exports.getSettings = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, settings || {});
});

exports.updateSettings = catchAsync(async (req, res) => {
  const settings = await service.updateSettings(req.body);
  sendSuccess(res, settings, "Settings updated");
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

