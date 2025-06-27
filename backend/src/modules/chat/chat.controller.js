const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./chat.service");

exports.searchUsers = catchAsync(async (req, res) => {
  const term = req.query.q || "";
  const users = await service.searchUsers(req.user.id, term);
  sendSuccess(res, users);
});

exports.getConversation = catchAsync(async (req, res) => {
  const otherId = req.params.userId;
  const convo = await service.getConversation(req.user.id, otherId);
  sendSuccess(res, convo);
});

exports.sendMessage = catchAsync(async (req, res) => {
  const otherId = req.params.userId;
  const { message } = req.body || {};
  if (!message || !message.trim()) {
    throw new AppError("Message required", 400);
  }
  const msg = await service.sendMessage({
    sender_id: req.user.id,
    receiver_id: otherId,
    message: message.trim(),
  });
  sendSuccess(res, msg, "Message sent");
});
