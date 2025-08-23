const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./moderation.service");

exports.getFlags = catchAsync(async (_req, res) => {
  const flags = await service.getFlaggedMessages();
  sendSuccess(res, flags);
});
