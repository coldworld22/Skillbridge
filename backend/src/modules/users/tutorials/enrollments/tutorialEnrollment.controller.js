const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const AppError = require("../../../../utils/AppError");
const { sendSuccess } = require("../../../../utils/response");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../../../utils/AppError");

// Enroll in tutorial
exports.enroll = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const user_id = req.user.id;

  const tutorial = await db("tutorials").where({ id: tutorialId }).first();
  if (!tutorial) throw new AppError("Tutorial not found", 404);
  if (tutorial.status !== "published")
    throw new AppError("Tutorial not published", 400);

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

  // Verify all chapters completed
  let allChaptersCompleted = true;
  const hasChapters = await db.schema.hasTable("tutorial_chapters");
  const hasCompletions = await db.schema.hasTable("tutorial_chapter_completions");

  if (hasChapters && hasCompletions) {
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

    allChaptersCompleted = Number(totalChapters) === Number(completedChapters);
  }

  // Verify quiz passed if any
  let quizPassed = true;
  const hasQuizzes = await db.schema.hasTable("tutorial_quizzes");
  const hasAttempts = await db.schema.hasTable("quiz_attempts");

  if (hasQuizzes && hasAttempts) {
    const quiz = await db("tutorial_quizzes")
      .where({ tutorial_id: tutorialId })
      .first();

    if (quiz) {
      const attempt = await db("quiz_attempts")
        .where({ tutorial_id: tutorialId, user_id, passed: true })
        .first();
      quizPassed = Boolean(attempt);
    }
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
