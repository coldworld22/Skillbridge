const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./messages.service");
const { prepareMessagingQuota } = require("./messageQuota.helper");

exports.getMyMessages = catchAsync(async (req, res) => {
  let { limit, offset } = req.query;
  const options = {};
  if (limit !== undefined) {
    const parsed = parseInt(limit, 10);
    if (!Number.isNaN(parsed)) options.limit = parsed;
  }
  if (offset !== undefined) {
    const parsed = parseInt(offset, 10);
    if (!Number.isNaN(parsed)) options.offset = parsed;
  }
  const data = Object.keys(options).length
    ? await service.getUserMessages(req.user.id, options)
    : await service.getUserMessages(req.user.id);
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
  const quota = await prepareMessagingQuota(req.user, "email");
  const data = await service.sendEmail({
    sender_id: req.user.id,
    receiver_id: req.params.id,
    subject: req.body.subject,
    message: req.body.message,
    quota,
  });
  sendSuccess(res, data, "Email sent");
});

exports.sendWhatsApp = catchAsync(async (req, res) => {
  const quota = await prepareMessagingQuota(req.user, "whatsapp");
  const data = await service.sendWhatsApp({
    sender_id: req.user.id,
    receiver_id: req.params.id,
    message: req.body.message,
    quota,
  });
  sendSuccess(res, data, "WhatsApp message sent");
});

exports.startVideoCall = catchAsync(async (req, res) => {
  const quota = await prepareMessagingQuota(req.user, "video");
  const data = await service.startVideoCall({
    sender_id: req.user.id,
    receiver_id: req.params.id,
    quota,
  });
  sendSuccess(res, data, "Video call started");
});

exports.respondVideoCall = catchAsync(async (req, res) => {
  const data = await service.respondVideoCall({
    call_id: req.params.id,
    user_id: req.user.id,
    action: req.body.action,
  });
  sendSuccess(res, data, `Call ${req.body.action}`);
});

exports.endVideoCall = catchAsync(async (req, res) => {
  const data = await service.endVideoCall({
    call_id: req.params.id,
    user_id: req.user.id,
  });
  sendSuccess(res, data, "Call ended");
});
