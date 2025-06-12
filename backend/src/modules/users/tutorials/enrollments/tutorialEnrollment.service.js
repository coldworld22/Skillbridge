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

