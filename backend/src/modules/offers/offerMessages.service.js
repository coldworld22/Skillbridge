const db = require("../../config/database");

exports.createMessage = async (data) => {
  const [row] = await db("offer_messages").insert(data).returning("*");
  return row;
};

exports.getMessages = (responseId) => {
  return db("offer_messages as m")
    .join("users as u", "m.sender_id", "u.id")
    .select(
      "m.*",
      "u.full_name as sender_name",
      "u.avatar_url as sender_avatar"
    )
    .where("m.response_id", responseId)
    .orderBy("m.sent_at", "asc");
};
