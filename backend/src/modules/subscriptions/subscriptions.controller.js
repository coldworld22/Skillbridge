const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./subscription.service");

exports.getMySubscriptions = catchAsync(async (req, res) => {
  const subs = await service.getActiveByUser(req.user.id);
  sendSuccess(res, subs);
});
