const db = require("../../config/database");

exports.createMessage = async (data) => {
  const [row] = await db("group_messages").insert(data).returning("*");
  return row;
};

exports.getMessageById = (id) => {
  return db({ m: "group_messages" })
    .join({ u: "users" }, "m.sender_id", "u.id")
    .select(
      "m.*",
      "u.full_name as sender_name",
      "u.avatar_url as sender_avatar"
    )
    .where("m.id", id)
    .first();
};

exports.listMessages = (groupId) => {
  return db({ m: "group_messages" })
    .join({ u: "users" }, "m.sender_id", "u.id")
    .select(
      "m.*",
      "u.full_name as sender_name",
      "u.avatar_url as sender_avatar"
    )
    .where("m.group_id", groupId)
    .orderBy("m.sent_at", "asc");
};
