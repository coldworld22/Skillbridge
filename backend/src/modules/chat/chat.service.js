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
    .limit(20);
};

exports.getConversation = async (userId, otherId) => {
  await db("messages")
    .where({ sender_id: otherId, receiver_id: userId, read: false })
    .update({ read: true, read_at: new Date() });

  return db("messages")
    .where(function () {
      this.where({ sender_id: userId, receiver_id: otherId })
        .orWhere({ sender_id: otherId, receiver_id: userId });
    })
    .orderBy("sent_at");
};

exports.sendMessage = async ({ sender_id, receiver_id, message }) => {
  const [row] = await db("messages")
    .insert({ sender_id, receiver_id, message })
    .returning("*");
  return row;
};
