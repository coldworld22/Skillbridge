const db = require("../../config/database");
const AppError = require("../../utils/AppError");

const VALID_STATUSES = new Set([
  "flagged",
  "pending_review",
  "escalated",
  "blocked",
  "dismissed",
  "resolved",
]);

const mapFlagStatusToMessageStatus = (status) => {
  switch (status) {
    case "blocked":
      return "blocked";
    case "escalated":
      return "escalated";
    case "dismissed":
    case "resolved":
      return "visible";
    case "pending_review":
    case "flagged":
    default:
      return "pending_review";
  }
};

const sanitizeJson = (value, fallback) => {
  if (!value || typeof value !== "object") {
    return fallback !== undefined ? fallback : {};
  }
  if (Array.isArray(value)) return value;
  return value;
};

exports.getFlaggedMessages = async ({
  status,
  contextType,
  limit,
  offset,
} = {}) => {
  const query = db({ cm: "chat_moderation" })
    .leftJoin({ u: "users" }, "cm.user_id", "u.id")
    .leftJoin({ m: "video_call_messages" }, "cm.message_id", "m.id")
    .select(
      "cm.id",
      "cm.user_id",
      "cm.message_id",
      "cm.context_type",
      "cm.context_id",
      "cm.message",
      "cm.severity",
      "cm.status",
      "cm.matched_words",
      "cm.metadata",
      "cm.auto_action_taken",
      "cm.notes",
      "cm.created_at",
      "cm.updated_at",
      db.raw("COALESCE(u.full_name, u.email, '') as user_name"),
      db.raw("COALESCE(u.role, '') as user_role"),
      "m.room_id",
      "m.moderation_status as message_status",
      "m.flag_metadata as message_metadata",
      "m.flagged_at as message_flagged_at"
    )
    .orderBy("cm.created_at", "desc");

  if (status && VALID_STATUSES.has(status)) {
    query.where("cm.status", status);
  }
  if (contextType) {
    query.where("cm.context_type", contextType);
  }
  if (Number.isFinite(limit)) {
    query.limit(limit);
  }
  if (Number.isFinite(offset)) {
    query.offset(offset);
  }

  const rows = await query;

  return rows.map((row) => {
    const matchedWords = sanitizeJson(row.matched_words, []);
    const metadata = sanitizeJson(row.metadata);
    const messageMetadata = sanitizeJson(row.message_metadata);
    return {
      id: row.id,
      userId: row.user_id,
      user: row.user_name,
      role: row.user_role,
      messageId: row.message_id,
      message: row.message,
      severity: row.severity,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      contextType: row.context_type,
      contextId: row.context_id,
      roomId: row.room_id,
      matchedWords,
      metadata,
      autoActionTaken: row.auto_action_taken,
      notes: row.notes,
      messageStatus: row.message_status,
      messageMetadata,
      messageFlaggedAt: row.message_flagged_at,
    };
  });
};

exports.updateFlagStatus = async (id, { status, notes, actorId } = {}) => {
  if (!VALID_STATUSES.has(status)) {
    throw new AppError("Invalid moderation status supplied", 400);
  }

  const now = new Date();

  return db.transaction(async (trx) => {
    const flag = await trx("chat_moderation").where({ id }).first();
    if (!flag) {
      throw new AppError("Moderation flag not found", 404);
    }

    let updatedMessage = null;

    const mergedMetadata = {
      ...(sanitizeJson(flag.metadata)),
      last_action: status,
      last_action_at: now.toISOString(),
      ...(actorId ? { last_action_by: actorId } : {}),
      ...(typeof notes === "string" && notes.trim()
        ? { last_action_notes: notes.trim() }
        : {}),
    };

    const updatePayload = {
      status,
      updated_at: now,
      metadata: mergedMetadata,
    };

    if (typeof notes === "string") {
      updatePayload.notes = notes.trim();
    }

    const [updatedFlag] = await trx("chat_moderation")
      .where({ id })
      .update(updatePayload)
      .returning("*");

    if (flag.message_id) {
      const messageStatus = mapFlagStatusToMessageStatus(status);
      const messageRow = await trx("video_call_messages")
        .where({ id: flag.message_id })
        .first();

      if (messageRow) {
        const updatedMessageMetadata = {
          ...sanitizeJson(messageRow.flag_metadata),
          last_action: status,
          last_action_at: now.toISOString(),
          ...(actorId ? { last_action_by: actorId } : {}),
          ...(typeof notes === "string" && notes.trim()
            ? { last_action_notes: notes.trim() }
            : {}),
        };

        const [messageUpdate] = await trx("video_call_messages")
          .where({ id: flag.message_id })
          .update({
            moderation_status: messageStatus,
            is_flagged: messageStatus !== "visible",
            flag_metadata: updatedMessageMetadata,
            flagged_at:
              messageStatus !== "visible"
                ? messageRow.flagged_at || flag.created_at || now
                : messageRow.flagged_at,
          })
          .returning("*");

        updatedMessage = messageUpdate || null;
      }
    }

    return {
      flag: updatedFlag,
      message: updatedMessage,
    };
  });
};
