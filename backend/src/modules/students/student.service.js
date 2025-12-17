const db = require("../../config/database");

exports.getPublicStudents = async () => {
  return db("users")
    .join("student_profiles", "users.id", "student_profiles.user_id")
    .whereRaw("LOWER(users.role) = ?", ["student"])
    .andWhere({ "users.status": "active" })
    .select(
      "users.id",
      "users.full_name",
      "users.avatar_url",
      "users.is_online",
      "student_profiles.education_level",
      "student_profiles.topics",
      "student_profiles.learning_goals"
    )
    .orderBy("users.created_at", "desc");
};

exports.getPublicStudent = async (id) => {
  return db("users")
    .join("student_profiles", "users.id", "student_profiles.user_id")
    .where({ "users.id": id })
    .andWhereRaw("LOWER(users.role) = ?", ["student"])
    .first(
      "users.id",
      "users.full_name",
      "users.avatar_url",
      "users.is_online",
      "users.email",
      "users.phone",
      "users.created_at",
      "student_profiles.education_level",
      "student_profiles.topics",
      "student_profiles.learning_goals"
    );
};
