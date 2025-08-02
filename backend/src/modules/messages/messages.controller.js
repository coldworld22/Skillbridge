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

exports.deleteMessage = catchAsync(async (req, res) => {
  const msg = await service.deleteMessage(req.user.id, req.params.id);
  if (!msg) throw new AppError("Message not found", 404);
  sendSuccess(res, msg, "Message deleted");
});

exports.sendEmail = catchAsync(async (req, res) => {
  const data = await service.sendEmail({
    sender_id: req.user.id,
    receiver_id: req.params.id,
    subject: req.body.subject,
    message: req.body.message,
  });
  sendSuccess(res, data, "Email sent");
});

exports.sendWhatsApp = catchAsync(async (req, res) => {
  const data = await service.sendWhatsApp({
    sender_id: req.user.id,
    receiver_id: req.params.id,
    message: req.body.message,
  });
  sendSuccess(res, data, "WhatsApp message sent");
});

exports.startVideoCall = catchAsync(async (req, res) => {
  const data = await service.startVideoCall({
    sender_id: req.user.id,
    receiver_id: req.params.id,
  });
  sendSuccess(res, data, "Video call started");
});
