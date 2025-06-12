const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");

// Submit or update a review
exports.submitReview = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const exists = await db("tutorial_reviews")
    .where({ tutorial_id: tutorialId, user_id: userId })
    .first();

  if (exists) {
    await db("tutorial_reviews")
      .where({ tutorial_id: tutorialId, user_id: userId })
      .update({ rating, comment, created_at: db.fn.now() });
  } else {
    await db("tutorial_reviews").insert({
      tutorial_id: tutorialId,
      user_id: userId,
      rating,
      comment,
    });
  }

  sendSuccess(res, null, "Review submitted");
});

// Get reviews for a tutorial
exports.getReviews = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;

  const reviews = await db("tutorial_reviews")
    .join("users", "users.id", "tutorial_reviews.user_id")
    .where("tutorial_reviews.tutorial_id", tutorialId)
    .select(
      "tutorial_reviews.id",
      "tutorial_reviews.rating",
      "tutorial_reviews.comment",
      "tutorial_reviews.created_at",
      "users.full_name",
      "users.avatar_url"
    );

  sendSuccess(res, reviews, "Reviews fetched");
});
