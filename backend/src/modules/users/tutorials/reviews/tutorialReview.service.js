const db = require("../../../../config/database");

exports.upsertReview = async ({ tutorial_id, user_id, rating, comment }) => {
  const exists = await db("tutorial_reviews")
    .where({ tutorial_id, user_id })
    .first();

  if (exists) {
    return db("tutorial_reviews")
      .where({ tutorial_id, user_id })
      .update({ rating, comment, created_at: db.fn.now() });
  }

  return db("tutorial_reviews").insert({
    tutorial_id,
    user_id,
    rating,
    comment,
  });
};

exports.getByTutorial = async (tutorial_id) => {
  return db("tutorial_reviews")
    .join("users", "users.id", "tutorial_reviews.user_id")
    .where("tutorial_reviews.tutorial_id", tutorial_id)
    .select(
      "tutorial_reviews.id",
      "tutorial_reviews.rating",
      "tutorial_reviews.comment",
      "tutorial_reviews.created_at",
      "users.full_name",
      "users.avatar_url"
    );
};
