const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./chat.service");
const logger = require("../../utils/logger");
const { resolveUploadFilePath } = require("../../utils/uploads");
const { subtractStorageUsage } = require("../../middleware/storage");
const fs = require("fs");

const removeAttachment = async (url, tenantId) => {
  if (!url || !url.includes("/uploads/")) return;
  const filePath = resolveUploadFilePath(url);
  if (!filePath) return;
  try {
    const stat = await fs.promises.stat(filePath);
    await fs.promises.unlink(filePath);
    if (tenantId && stat?.size) {
      await subtractStorageUsage(tenantId, stat.size);
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      logger.warn("Failed to delete chat attachment", err.message);
    }
  }
};

exports.searchUsers = catchAsync(async (req, res) => {
  const term = req.query.q || "";
  const users = await service.searchUsers(req.user.id, term, req.tenant?.id || null);
  sendSuccess(res, users);
});

exports.getConversation = catchAsync(async (req, res) => {
  const otherId = req.params.userId;
  const convo = await service.getConversation(req.user.id, otherId, req.tenant?.id || null);
  sendSuccess(res, convo);
});

exports.sendMessage = catchAsync(async (req, res) => {
  const otherId = req.params.userId;
  const { message, replyTo } = req.body || {};

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
    reply_to_id: replyTo || null,
    tenant_id: req.tenant?.id || null,
  });
  sendSuccess(res, msg, "Message sent");
});

exports.deleteMessage = catchAsync(async (req, res) => {
  const tenantId = req.tenant?.id || null;
  const msg = await service.deleteMessage(req.user.id, req.params.id, tenantId);
  if (!msg) throw new AppError("Message not found", 404);
  await Promise.all([
    removeAttachment(msg.file_url, msg.tenant_id || tenantId),
    removeAttachment(msg.audio_url, msg.tenant_id || tenantId),
  ]);
  sendSuccess(res, msg, "Message deleted");
});

exports.togglePin = catchAsync(async (req, res) => {
  const msg = await service.togglePin(req.user.id, req.params.id, req.tenant?.id || null);
  if (!msg) throw new AppError("Message not found", 404);
  sendSuccess(res, msg, msg.pinned ? "Pinned" : "Unpinned");
});

exports.logModerationEvent = catchAsync(async (req, res) => {
  const { message, matchedWords } = req.body || {};
  await service.logModerationEvent({
    userId: req.user.id,
    message,
    matchedWords,
  });
  sendSuccess(res, null, "Moderation event logged");
});
