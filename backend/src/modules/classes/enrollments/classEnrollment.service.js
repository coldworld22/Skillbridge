const db = require("../../../config/database");

exports.findEnrollment = async (user_id, class_id) => {
  return db("class_enrollments").where({ user_id, class_id }).first();
};

exports.createEnrollment = async (data) => {
  const [row] = await db("class_enrollments").insert(data).returning("*");
  return row;
};

exports.markCompleted = async (user_id, class_id) => {
  return db("class_enrollments")
    .where({ user_id, class_id })
    .update({ status: "completed" });
};

exports.getByUser = async (user_id) => {
  return db("class_enrollments")
    .join("online_classes", "online_classes.id", "class_enrollments.class_id")
    .leftJoin("users as u", "online_classes.instructor_id", "u.id")
    .where("class_enrollments.user_id", user_id)
    .select(
      "online_classes.*",
      "class_enrollments.status",
      "class_enrollments.enrolled_at",
      "u.full_name as instructor"
    );
};
