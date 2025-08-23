const db = require("../../config/database");

exports.getFlaggedMessages = async () => {
  return db({ cm: "chat_moderation" })
    .join({ u: "users" }, "cm.user_id", "u.id")
    .select(
      "cm.id",
      db.raw("COALESCE(u.full_name, u.email, '') as user"),
      db.raw("COALESCE(u.role, '') as role"),
      db.raw("cm.message as content"),
      db.raw("cm.matched_words"),
      db.raw("cm.created_at as time"),
      db.raw("'Flagged' as status")
    )
    .orderBy("cm.created_at", "desc");
};
