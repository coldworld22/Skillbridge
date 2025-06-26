const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./notifications.service");

exports.getMyNotifications = catchAsync(async (req, res) => {
  const data = await service.getUserNotifications(req.user.id);
  sendSuccess(res, data);
});

exports.markRead = catchAsync(async (req, res) => {
  const note = await service.markAsRead(req.params.id, req.user.id);
  if (!note) throw new AppError("Notification not found", 404);
  sendSuccess(res, note, "Notification marked as read");
});
