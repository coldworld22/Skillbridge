const db = require("../../config/database");

exports.createMessage = async (data) => {
  const [row] = await db("offer_messages").insert(data).returning("*");
  return row;
};

exports.getMessageById = (id) => {
  return db({ m: "offer_messages" })
    .leftJoin({ r: "offer_messages" }, "m.reply_to_id", "r.id")
    .join({ u: "users" }, "m.sender_id", "u.id")
    .select(
      "m.*",
      "u.full_name as sender_name",
      "u.avatar_url as sender_avatar",
      db.raw("r.message as reply_message")
    )
    .where("m.id", id)
    .first();
};

exports.getMessages = (responseId) => {
  return db({ m: "offer_messages" })
    .leftJoin({ r: "offer_messages" }, "m.reply_to_id", "r.id")
    .join({ u: "users" }, "m.sender_id", "u.id")
    .select(
      "m.*",
      "u.full_name as sender_name",
      "u.avatar_url as sender_avatar",
      db.raw("r.message as reply_message")
    )
    .where("m.response_id", responseId)
    .orderBy("m.sent_at", "asc");
};
