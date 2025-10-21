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

exports.logModerationEvent = async ({ userId, message, matchedWords }) => {
  const [row] = await db("chat_moderation")
    .insert({
      user_id: userId,
      message,
      matched_words: JSON.stringify(matchedWords),
      created_at: new Date(),
    })
    .returning("*");

  const admins = await userModel.findAdmins();
  const note = `Flagged chat message from user ${userId}: ${matchedWords.join(", ")}`;
  const results = await Promise.allSettled(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "chat_moderation",
        message: note,
      })
    )
  );
  results.forEach((r, idx) => {
    if (r.status === "rejected") {
      logger.error(
        `Failed to notify admin ${admins[idx].id}:`,
        r.reason?.message || r.reason
      );
    }
  });

  return row;
};
