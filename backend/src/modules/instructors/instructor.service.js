const db = require("../../config/database");

exports.getPublicInstructors = async () => {
  return db("users")
    .join("instructor_profiles", "users.id", "instructor_profiles.user_id")
    .where({ "users.role": "instructor", "users.status": "active" })
    .select(
      "users.id",
      "users.full_name",
      "users.avatar_url",
      "instructor_profiles.expertise",
      "instructor_profiles.experience",
      "instructor_profiles.pricing",
      "instructor_profiles.demo_video_url"
    )
    .orderBy("users.created_at", "desc");
};

exports.getPublicInstructor = async (id) => {
  return db("users")
    .join("instructor_profiles", "users.id", "instructor_profiles.user_id")
    .where({ "users.id": id, "users.role": "instructor" })
    .first(
      "users.id",
      "users.full_name",
      "users.avatar_url",
      "instructor_profiles.expertise",
      "instructor_profiles.experience",
      "instructor_profiles.pricing",
      "instructor_profiles.demo_video_url"
    );
};
