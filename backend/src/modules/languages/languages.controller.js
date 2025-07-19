const service = require("./languages.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const fs = require("fs");
const path = require("path");

exports.createLanguage = catchAsync(async (req, res) => {
  const data = { ...req.body };
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
  if (req.file) {
    if (existing.icon_url) {
      const oldPath = path.join(__dirname, "../../../", existing.icon_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.icon_url = `/uploads/languages/${req.file.filename}`;
  }

  const lang = await service.update(req.params.id, data);
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
