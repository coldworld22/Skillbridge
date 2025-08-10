const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const AppError = require("../../../../utils/AppError");
const { sendSuccess } = require("../../../../utils/response");
const { v4: uuidv4 } = require("uuid");

// Enroll in tutorial
exports.enroll = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const user_id = req.user.id;

  const tutorial = await db("tutorials").where({ id: tutorialId }).first();
  if (!tutorial) throw new AppError("Tutorial not found", 404);
  if (tutorial.moderation_status !== "Approved")
    throw new AppError("Tutorial not approved", 400);
  if (tutorial.status !== "published")
    throw new AppError("Tutorial not published", 400);

  if (tutorial.is_paid) {
    const payment = await db("payments")
      .where({ user_id, item_type: "tutorial", item_id: tutorialId })
      .first();
    if (!payment) throw new AppError("Payment required", 402);
    const hasPlan = payment.installments > 1;
    const isPaid = payment.status === "paid";
    if (!isPaid && !hasPlan)
      throw new AppError("Payment incomplete", 402);
  }

  const exists = await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .first();

  if (exists) return sendSuccess(res, exists, "Already enrolled");

  const id = uuidv4();
  await db("tutorial_enrollments").insert({
    id,
    user_id,
    tutorial_id: tutorialId,
    status: "enrolled",
  });

  sendSuccess(res, { id }, "Enrolled successfully");
});

// Mark as completed
exports.complete = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const user_id = req.user.id;

  // Ensure enrollment exists
  const enrollment = await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .first();
  if (!enrollment) throw new AppError("Enrollment not found", 404);

  // Verify all chapters completed
  const [{ count: totalChapters }] = await db("tutorial_chapters")
    .where({ tutorial_id: tutorialId })
    .count("id as count");

  const [{ count: completedChapters }] = await db(
    "tutorial_chapter_completions as tcc"
  )
    .join("tutorial_chapters as tc", "tcc.chapter_id", "tc.id")
    .where("tc.tutorial_id", tutorialId)
    .andWhere("tcc.user_id", user_id)
    .count("tcc.id as count");

  const allChaptersCompleted =
    Number(totalChapters) === Number(completedChapters);

  // Verify quiz passed if any
  let quizPassed = true;
  const quiz = await db("tutorial_quizzes")
    .where({ tutorial_id: tutorialId })
    .first();

  if (quiz) {
    const attempt = await db("quiz_attempts")
      .where({ tutorial_id: tutorialId, user_id, passed: true })
      .first();
    quizPassed = Boolean(attempt);
  }

  if (!allChaptersCompleted || !quizPassed) {
    throw new AppError(
      "Complete all chapters and pass the required quiz before finishing the tutorial",
      400
    );
  }

  await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .update({ status: "completed" });

  sendSuccess(res, null, "Marked as completed");
});

// Get all enrolled tutorials for student
exports.getMyEnrollments = catchAsync(async (req, res) => {
  const user_id = req.user.id;

  const rows = await db("tutorial_enrollments")
    .join("tutorials", "tutorials.id", "tutorial_enrollments.tutorial_id")
    .where("tutorial_enrollments.user_id", user_id)
    .select("tutorials.*", "tutorial_enrollments.status", "tutorial_enrollments.enrolled_at");

  sendSuccess(res, rows);
});
