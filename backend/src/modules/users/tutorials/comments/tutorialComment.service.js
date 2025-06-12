const db = require("../../../../config/database");

exports.createComment = async (data) => {
  await db("tutorial_comments").insert(data);
  return data;
};

exports.getByTutorial = async (tutorial_id) => {
  return db("tutorial_comments")
    .join("users", "users.id", "tutorial_comments.user_id")
    .where("tutorial_comments.tutorial_id", tutorial_id)
    .select(
      "tutorial_comments.*",
      "users.full_name",
      "users.avatar_url"
    )
    .orderBy("created_at", "asc");
};
