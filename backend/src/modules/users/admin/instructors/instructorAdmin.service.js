const db = require("../../../../config/database");

exports.getAllInstructors = async () => {
  return await db("users")
    .join("instructor_profiles", "users.id", "instructor_profiles.user_id")
    .select(
      "users.id",
      "users.full_name",
      "users.email",
      "users.phone",
      "users.status",
      "users.avatar_url",

      "users.created_at",

      "instructor_profiles.expertise",
      "instructor_profiles.experience",
      "instructor_profiles.pricing"
    );
};

exports.getInstructorById = async (id) => {
  const [user] = await db("users")
    .where({ "users.id": id })
    .join("instructor_profiles", "users.id", "instructor_profiles.user_id")
    .select(
      "users.id",
      "users.full_name",
      "users.email",
      "users.phone",
      "users.status",
      "users.avatar_url",

      "users.created_at",

      "instructor_profiles.expertise",
      "instructor_profiles.experience",
      "instructor_profiles.pricing",
      "instructor_profiles.demo_video_url"
    );
  return user;
};

exports.updateInstructorStatus = async (id, status) => {
  await db("users").where({ id }).update({ status });
  return { id, status };
};

exports.deleteInstructor = async (id) => {
  await db("users").where({ id }).del();
};
