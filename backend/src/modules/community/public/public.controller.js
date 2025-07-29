const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const service = require("./public.service");

exports.listDiscussions = catchAsync(async (_req, res) => {
  const list = await service.listDiscussions();
  sendSuccess(res, list);
});

exports.getDiscussion = catchAsync(async (req, res) => {
  const disc = await service.getDiscussion(req.params.id);
  if (!disc) throw new AppError("Discussion not found", 404);
  sendSuccess(res, disc);
});
