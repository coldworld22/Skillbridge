const service = require("./languages.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");

exports.createLanguage = catchAsync(async (req, res) => {
  const lang = await service.create(req.body);
  sendSuccess(res, lang, "Language created");
});

exports.listLanguages = catchAsync(async (_req, res) => {
  const langs = await service.list();
  sendSuccess(res, langs);
});

exports.updateLanguage = catchAsync(async (req, res) => {
  const lang = await service.update(req.params.id, req.body);
  sendSuccess(res, lang, "Language updated");
});

exports.deleteLanguage = catchAsync(async (req, res) => {
  await service.remove(req.params.id);
  sendSuccess(res, null, "Language deleted");
});
