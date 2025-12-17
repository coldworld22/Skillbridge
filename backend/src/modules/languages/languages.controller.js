const service = require("./languages.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const fs = require("fs");
const path = require("path");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return Boolean(value);
};

exports.createLanguage = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (data.name) data.name = data.name.trim();
  if (data.code) data.code = data.code.trim();
  if (data.is_active !== undefined) data.is_active = toBoolean(data.is_active);
  if (data.is_default !== undefined) data.is_default = toBoolean(data.is_default);
  if (req.file) {
    data.icon_url = `/uploads/languages/${req.file.filename}`;
  }
  const lang = await service.create(data);

  sendSuccess(res, lang, "Language created");
});

exports.listLanguages = catchAsync(async (_req, res) => {
  const langs = await service.list();
  sendSuccess(res, langs);
});

exports.updateLanguage = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError("Language not found", 404);

  const data = { ...req.body };
  if (data.name) data.name = data.name.trim();
  if (data.code) data.code = data.code.trim();
  if (data.is_active !== undefined) data.is_active = toBoolean(data.is_active);
  if (data.is_default !== undefined) data.is_default = toBoolean(data.is_default);
  if (req.file) {
    if (existing.icon_url) {
      const oldPath = path.join(__dirname, "../../../", existing.icon_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.icon_url = `/uploads/languages/${req.file.filename}`;
  }

  const lang = await service.update(req.params.id, data);
  const admins = await userModel.findAdmins();
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "language_updated",
        message: `Language ${lang.name} was updated`,
      })
    )
  );
  await Promise.all(
    admins.map((admin) =>
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: admin.id,
        message: `Language ${lang.name} was updated`,
      })
    )
  );
  sendSuccess(res, lang, "Language updated");
});

exports.deleteLanguage = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (existing?.icon_url) {
    const oldPath = path.join(__dirname, "../../../", existing.icon_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  await service.remove(req.params.id);
  sendSuccess(res, null, "Language deleted");
});
