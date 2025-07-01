const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const msgService = require("./groupMessages.service");
const groupService = require("./groups.service");

exports.getMessages = catchAsync(async (req, res) => {
  const { id } = req.params;
  const messages = await msgService.listMessages(id);
  sendSuccess(res, messages);
});

exports.sendMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body || {};
  if (!message || !message.trim()) {
    throw new AppError("Message required", 400);
  }
  const isMember = await groupService.isMember(id, req.user.id);
  if (!isMember) throw new AppError("Not authorized", 403);
  const created = await msgService.createMessage({
    group_id: id,
    sender_id: req.user.id,
    content: message.trim(),
  });
  const full = await msgService.getMessageById(created.id);
  sendSuccess(res, full, "Message sent");
});
