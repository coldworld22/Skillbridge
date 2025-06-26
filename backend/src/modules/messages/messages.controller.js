const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./messages.service");

exports.getMyMessages = catchAsync(async (req, res) => {
  const data = await service.getUserMessages(req.user.id);
  sendSuccess(res, data);
});

exports.markRead = catchAsync(async (req, res) => {
  const msg = await service.markAsRead(req.params.id, req.user.id);
  if (!msg) throw new AppError("Message not found", 404);
  sendSuccess(res, msg, "Message marked as read");
});
