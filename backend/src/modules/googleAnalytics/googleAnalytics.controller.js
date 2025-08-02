const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("../thirdPartyConfig/thirdPartyConfig.service");

exports.getConfig = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  const cfg = settings?.googleAnalytics;
  sendSuccess(res, cfg?.active === false ? {} : cfg || {});
});
