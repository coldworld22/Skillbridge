const db = require("../../config/database");

exports.searchUsers = async (term) => {
  return db("users")
    .select(
      "id",
      db.raw("COALESCE(full_name, '') as name"),
      "email",
      "phone",
      db.raw("COALESCE(avatar_url, '') as profileImage")
    )
    .modify((query) => {
      if (term) {
        const t = `%${term}%`;
        query.where("full_name", "ilike", t)
          .orWhere("email", "ilike", t)
          .orWhere("phone", "ilike", t);
      }
    })
    .limit(20);
};

exports.getConversation = async (userId, otherId) => {
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
