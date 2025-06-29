const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./socialLoginConfig.service");
const { initStrategies } = require("../../config/passport");

exports.getSettings = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, settings || {});
});

exports.updateSettings = catchAsync(async (req, res) => {
  const settings = await service.updateSettings(req.body);
  try {
    await initStrategies();
  } catch (err) {
    console.error("Failed to reinitialize passport strategies", err);
  }
  sendSuccess(res, settings, "Settings updated");
});
