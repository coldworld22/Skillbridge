const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const notificationService = require("../notifications/notifications.service");
const userModel = require("../users/user.model");
const messageService = require("../messages/messages.service");

exports.searchUsers = async (currentUserId, term) => {
  const subquery = db("messages")
    .select("sender_id")
    .count("id as count")
    .where({ receiver_id: currentUserId, read: false })
    .groupBy("sender_id")
    .as("unread");

  const lastMessageSub = db.raw(
    `(
      SELECT DISTINCT ON (other_user)
        other_user AS user_id,
        message,
        EXTRACT(EPOCH FROM sent_at) * 1000 AS last_message_at
      FROM (
        SELECT
          CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user,
          message,
          sent_at
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
      ) m
      ORDER BY other_user, sent_at DESC
    ) as last_msg`,
    [currentUserId, currentUserId, currentUserId]
  );

  return db("users")
    .select(
      "users.id",
      db.raw("COALESCE(users.full_name, '') as name"),
      "users.email",
      "users.phone",
      db.raw("COALESCE(users.avatar_url, '') as profileImage"),
      db.raw("COALESCE(unread.count, 0) as unreadMessages"),
      db.raw("COALESCE(users.is_online, false) as \"isOnline\""),
      db.raw("EXTRACT(EPOCH FROM users.updated_at) * 1000 as \"lastActive\""),
      db.raw("COALESCE(last_msg.message, '') as last_message"),
      db.raw("COALESCE(last_msg.last_message_at, 0) as last_message_at")
    )
    .leftJoin(subquery, "users.id", "unread.sender_id")
    .leftJoin(lastMessageSub, "users.id", "last_msg.user_id")
    .modify((query) => {
      if (term) {
        const t = `%${term}%`;
        query
          .where("users.full_name", "ilike", t)
          .orWhere("users.email", "ilike", t)
          .orWhere("users.phone", "ilike", t);
      }
    })
    .whereNot("users.id", currentUserId)
    .whereNotIn("users.role", ["Admin", "SuperAdmin"])
    .limit(20);
};

exports.getConversation = async (userId, otherId) => {
  await db("messages")
    .where({ sender_id: otherId, receiver_id: userId, read: false })
    .update({ read: true, read_at: new Date() });

  return db({ m: "messages" })
    .leftJoin({ r: "messages" }, "m.reply_to_id", "r.id")
    .select(
      "m.*",
      db.raw("r.message as reply_message"),
      db.raw("r.file_url as reply_file_url"),
      db.raw("r.audio_url as reply_audio_url")
    )
    .where(function () {
      this.where({ "m.sender_id": userId, "m.receiver_id": otherId })
        .orWhere({ "m.sender_id": otherId, "m.receiver_id": userId });
    })
    .orderBy("m.sent_at");
};

exports.sendMessage = async ({
  sender_id,
  receiver_id,
  message,
  file_url,
  audio_url,
  reply_to_id,
}) =>
  messageService.createMessage({
    sender_id,
    receiver_id,
    message,
    file_url,
    audio_url,
    reply_to_id,
  });

exports.deleteMessage = async (userId, id) => {
  const [row] = await db("messages")
    .where({ id })
    .andWhere(function () {
      this.where({ sender_id: userId }).orWhere({ receiver_id: userId });
    })
    .del()
    .returning("*");
  return row;
};

exports.togglePin = async (userId, id) => {
  const msg = await db("messages")
    .where({ id })
    .andWhere(function () {
      this.where({ sender_id: userId }).orWhere({ receiver_id: userId });
    })
    .first();
  if (!msg) return null;
  const [updated] = await db("messages")
    .where({ id })
    .update({ pinned: !msg.pinned })
    .returning("*");
  return updated;
};

exports.logModerationEvent = async ({
  userId,
  message,
  matchedWords = [],
  contextType = "direct_message",
  contextId = null,
  messageId = null,
  severity = "medium",
  status = "flagged",
  notes = null,
  metadata = {},
  autoActionTaken = false,
}) => {
  const sanitizedMatches = Array.isArray(matchedWords)
    ? matchedWords
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object") {
            return {
              term: entry.term ?? entry?.matched ?? null,
              ruleId: entry.ruleId ?? null,
              label: entry.label ?? null,
              severity: entry.severity ?? null,
            };
          }
          return null;
        })
        .filter(Boolean)
    : [];

  const metadataPayload =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata
      : {};
  if (!metadataPayload.matches && sanitizedMatches.length && typeof sanitizedMatches[0] === "object") {
    metadataPayload.matches = sanitizedMatches;
  }

  const now = new Date();
  const [row] = await db("chat_moderation")
    .insert({
      user_id: userId,
      message,
      matched_words: sanitizedMatches,
      context_type: contextType,
      context_id: contextId,
      message_id: messageId,
      severity,
      status,
      notes,
      metadata: metadataPayload,
      auto_action_taken: autoActionTaken,
      created_at: now,
      updated_at: now,
    })
    .returning("*");

  try {
    const admins = await userModel.findAdmins();
    if (admins.length) {
      const summaryTerms = sanitizedMatches
        .map((entry) =>
          typeof entry === "string" ? entry : entry.term || entry.ruleId || "match"
        )
        .filter(Boolean)
        .join(", ");
      const contextPart = contextId ? `${contextType}:${contextId}` : contextType;
      const note = [
        `Moderation ${severity?.toUpperCase() || "INFO"} flagged user ${userId}`,
        contextPart ? `context ${contextPart}` : null,
        summaryTerms ? `terms: ${summaryTerms}` : null,
      ]
        .filter(Boolean)
        .join(" – ");
      const results = await Promise.allSettled(
        admins.map((admin) =>
          notificationService.createNotification({
            user_id: admin.id,
            type: "chat_moderation",
            message: note,
          })
        )
      );
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.error(
            `Failed to notify admin ${admins[index].id}:`,
            result.reason?.message || result.reason
          );
        }
      });
    }
  } catch (notifyErr) {
    logger.error("Failed to broadcast moderation alert", notifyErr);
  }

  return row;
};
