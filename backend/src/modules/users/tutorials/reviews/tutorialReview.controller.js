const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const AppError = require("../../../../utils/AppError");
const { requireUserAndTutorial, requireValidTutorialId } = require("../utils");

// Submit or update a review
exports.submitReview = catchAsync(async (req, res) => {
  const { userId, tutorialId } = requireUserAndTutorial(req);
  const { rating, comment } = req.body;

  const enrolled = await db("tutorial_enrollments")
    .where({ tutorial_id: tutorialId, user_id: userId })
    .first();

  if (!enrolled)
    throw new AppError(
      "You must enroll in the tutorial before submitting a review.",
      403
    );

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
  const tutorialId = requireValidTutorialId(req);

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
