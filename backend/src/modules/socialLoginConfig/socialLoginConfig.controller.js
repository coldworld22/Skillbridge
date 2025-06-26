const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./socialLoginConfig.service");

exports.getSettings = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, settings || {});
});

exports.updateSettings = catchAsync(async (req, res) => {
  const settings = await service.updateSettings(req.body);
  sendSuccess(res, settings, "Settings updated");
});
