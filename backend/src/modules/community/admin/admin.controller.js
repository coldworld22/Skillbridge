const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const service = require("./admin.service");

exports.getDiscussions = catchAsync(async (_req, res) => {
  const list = await service.getAllDiscussions();
  sendSuccess(res, list);
});

exports.getDiscussion = catchAsync(async (req, res) => {
  const discussion = await service.getDiscussionById(req.params.id);
  if (!discussion) throw new AppError("Discussion not found", 404);
  sendSuccess(res, discussion);
});

exports.deleteDiscussion = catchAsync(async (req, res) => {
  await service.deleteDiscussion(req.params.id);
  sendSuccess(res, null, "Discussion deleted");
});

exports.lockDiscussion = catchAsync(async (req, res) => {
  const row = await service.setLocked(req.params.id, true);
  if (!row) throw new AppError("Discussion not found", 404);
  sendSuccess(res, row, "Discussion locked");
});

exports.unlockDiscussion = catchAsync(async (req, res) => {
  const row = await service.setLocked(req.params.id, false);
  if (!row) throw new AppError("Discussion not found", 404);
  sendSuccess(res, row, "Discussion unlocked");
});
