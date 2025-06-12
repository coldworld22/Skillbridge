const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const { v4: uuidv4 } = require("uuid");

// Enroll in tutorial
exports.enroll = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const user_id = req.user.id;

  const exists = await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .first();

  if (exists) return sendSuccess(res, exists, "Already enrolled");

  const id = uuidv4();
  await db("tutorial_enrollments").insert({
    id,
    user_id,
    tutorial_id: tutorialId,
    status: "enrolled"
  });

  sendSuccess(res, { id }, "Enrolled successfully");
});

// Mark as completed
exports.complete = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const user_id = req.user.id;

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
