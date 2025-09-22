const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./notifications.service");
const { isAdminRole } = require("../../utils/role");

exports.getMyNotifications = catchAsync(async (req, res) => {
  const data = await service.getUserNotifications(req.user.id);
  sendSuccess(res, data);
});

exports.markRead = catchAsync(async (req, res) => {
  const note = await service.markAsRead(req.params.id, req.user.id);
  if (!note) throw new AppError("Notification not found", 404);
  sendSuccess(res, note, "Notification marked as read");
});

exports.create = catchAsync(async (req, res) => {
  const { user_id: bodyUserId, type, message } = req.body || {};
  const isAdmin = isAdminRole(req.user.roles || req.user.role);
  const targetUserId = isAdmin ? bodyUserId : req.user.id;

  if (!targetUserId || !type || !message) {
    throw new AppError("Missing fields", 400);
  }

  const note = await service.createNotification({
    user_id: targetUserId,
    type,
    message,
  });
  sendSuccess(res, note, "Notification created");
});

exports.remove = catchAsync(async (req, res) => {
  const note = await service.deleteNotification(req.params.id, req.user.id);
  if (!note) throw new AppError("Notification not found", 404);
  sendSuccess(res, note, "Notification deleted");
});
