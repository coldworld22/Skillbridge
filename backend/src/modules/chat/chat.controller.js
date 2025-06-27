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

  const file = req.files?.file?.[0];
  const audio = req.files?.audio?.[0];

  if (!message && !file && !audio) {
    throw new AppError("Message or attachment required", 400);
  }

  const fileUrl = file ? `/uploads/chat/${file.filename}` : null;
  const audioUrl = audio ? `/uploads/chat/${audio.filename}` : null;

  const msg = await service.sendMessage({
    sender_id: req.user.id,
    receiver_id: otherId,
    message: message ? message.trim() : "",
    file_url: fileUrl,
    audio_url: audioUrl,
  });
  sendSuccess(res, msg, "Message sent");
});
