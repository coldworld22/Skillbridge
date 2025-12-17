const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const { isAdminRole } = require("../../utils/role");
const { state } = require("../../sockets");
const service = require("./moderation.service");

const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const formatFlagRow = (flagRow) => {
  if (!flagRow) return null;
  return {
    id: flagRow.id,
    userId: flagRow.user_id,
    messageId: flagRow.message_id,
    contextType: flagRow.context_type,
    contextId: flagRow.context_id,
    severity: flagRow.severity,
    status: flagRow.status,
    createdAt: flagRow.created_at,
    updatedAt: flagRow.updated_at,
    matchedWords: ensureArray(flagRow.matched_words),
    metadata: ensureObject(flagRow.metadata),
    autoActionTaken: flagRow.auto_action_taken,
    notes: flagRow.notes,
  };
};

const formatMessageRow = (messageRow) => {
  if (!messageRow) return null;
  return {
    id: messageRow.id,
    roomId: messageRow.room_id,
    moderationStatus: messageRow.moderation_status,
    isFlagged: messageRow.is_flagged,
    flagMetadata: ensureObject(messageRow.flag_metadata),
    flaggedAt: messageRow.flagged_at,
  };
};

exports.getFlags = catchAsync(async (req, res) => {
  const roles = req.user?.roles || req.user?.role;
  if (!isAdminRole(roles)) {
    throw new AppError("Forbidden", 403);
  }

  const { status, contextType, limit, offset } = req.query || {};
  const flags = await service.getFlaggedMessages({
    status,
    contextType,
    limit: Number.isFinite(Number(limit)) ? Number(limit) : undefined,
    offset: Number.isFinite(Number(offset)) ? Number(offset) : undefined,
  });
  sendSuccess(res, flags);
});

exports.updateFlag = catchAsync(async (req, res) => {
  const roles = req.user?.roles || req.user?.role;
  if (!isAdminRole(roles)) {
    throw new AppError("Forbidden", 403);
  }

  const { id } = req.params;
  const { status, notes } = req.body || {};
  if (!status) {
    throw new AppError("Status is required", 400);
  }

  const result = await service.updateFlagStatus(id, {
    status,
    notes,
    actorId: req.user?.id || null,
  });

  const formattedFlag = formatFlagRow(result.flag);
  const formattedMessage = formatMessageRow(result.message);

  if (
    state?.io &&
    formattedFlag?.contextId &&
    formattedFlag?.contextType &&
    formattedMessage?.roomId
  ) {
    state.io.to(formattedFlag.contextId).emit("call-message-flag-updated", {
      flagId: formattedFlag.id,
      messageId: formattedFlag.messageId,
      status: formattedFlag.status,
      severity: formattedFlag.severity,
      contextType: formattedFlag.contextType,
      contextId: formattedFlag.contextId,
      messageStatus: formattedMessage.moderationStatus,
      isFlagged: formattedMessage.isFlagged,
      flagMetadata: formattedMessage.flagMetadata,
    });
  }

  sendSuccess(
    res,
    {
      flag: formattedFlag,
      message: formattedMessage,
    },
    "Moderation flag updated"
  );
});
