const db = require("../../config/database");

exports.searchUsers = async (currentUserId, term) => {
  const subquery = db("messages")
    .select("sender_id")
    .count("id as count")
    .where({ receiver_id: currentUserId, read: false })
    .groupBy("sender_id")
    .as("unread");

  return db("users")
    .select(
      "users.id",
      db.raw("COALESCE(users.full_name, '') as name"),
      "users.email",
      "users.phone",
      db.raw("COALESCE(users.avatar_url, '') as profileImage"),
      db.raw("COALESCE(unread.count, 0) as unreadMessages")
    )
    .leftJoin(subquery, "users.id", "unread.sender_id")
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

exports.sendMessage = async ({ sender_id, receiver_id, message, file_url, audio_url, reply_to_id }) => {
  const [row] = await db("messages")
    .insert({ sender_id, receiver_id, message, file_url, audio_url, reply_to_id })
    .returning("*");
  return row;
};

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
