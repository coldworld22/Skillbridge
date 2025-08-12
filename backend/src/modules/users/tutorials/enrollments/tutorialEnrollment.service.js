const db = require("../../../../config/database");

exports.findEnrollment = async (user_id, tutorial_id) => {
  return db("tutorial_enrollments")
    .where({ user_id, tutorial_id })
    .first();
};

exports.createEnrollment = async (data) => {
  await db("tutorial_enrollments").insert(data);
  return data;
};

exports.markCompleted = async (user_id, tutorial_id) => {
  return db("tutorial_enrollments")
    .where({ user_id, tutorial_id })
    .update({ status: "completed" });
};

exports.getByUser = async (user_id) => {
  return db("tutorial_enrollments")
    .join("tutorials", "tutorials.id", "tutorial_enrollments.tutorial_id")
    .where("tutorial_enrollments.user_id", user_id)
    .select("tutorials.*", "tutorial_enrollments.status", "tutorial_enrollments.enrolled_at");
};

// List all students enrolled in a tutorial
exports.getByTutorial = async (tutorial_id) => {
  return db("tutorial_enrollments as te")
    .join("users as u", "te.user_id", "u.id")
    .where("te.tutorial_id", tutorial_id)
    .select(
      "u.id",
      "u.full_name",
      "u.email",
      "u.phone",
      "te.status",
      "te.enrolled_at"
    )
    .orderBy("te.enrolled_at");
};

exports.recalculateProgress = async (user_id, tutorial_id) => {
  const [{ count: totalChapters }] = await db("tutorial_chapters")
    .where({ tutorial_id })
    .count("id as count");

  const [{ count: completedChapters }] = await db(
    "tutorial_chapter_completions as tcc"
  )
    .join("tutorial_chapters as tc", "tcc.chapter_id", "tc.id")
    .where("tc.tutorial_id", tutorial_id)
    .andWhere("tcc.user_id", user_id)
    .count("tcc.id as count");

  const [{ count: totalAssignments }] = await db("tutorial_assignments")
    .where({ tutorial_id })
    .count("id as count");

  const [{ count: submittedAssignments }] = await db(
    "tutorial_assignment_submissions as tas"
  )
    .join("tutorial_assignments as ta", "tas.assignment_id", "ta.id")
    .where("ta.tutorial_id", tutorial_id)
    .andWhere("tas.user_id", user_id)
    .count("tas.id as count");

  const total =
    Number(totalChapters) + Number(totalAssignments);
  let progress = 0;
  if (total > 0) {
    progress =
      ((Number(completedChapters) + Number(submittedAssignments)) / total) *
      100;
  }

  await db("tutorial_enrollments")
    .where({ user_id, tutorial_id })
    .update({ progress });

  return progress;
};

