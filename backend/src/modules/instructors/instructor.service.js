const db = require("../../config/database");

exports.getPublicInstructors = async () => {
  return db("users")
    .join("instructor_profiles", "users.id", "instructor_profiles.user_id")
    .whereRaw("LOWER(users.role) = ?", ["instructor"])
    .andWhere({ "users.status": "active" })
    .select(
      "users.id",
      "users.full_name",
      "users.avatar_url",
      "users.is_online",
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
    .where({ "users.id": id })
    .andWhereRaw("LOWER(users.role) = ?", ["instructor"])
    .first(
      "users.id",
      "users.full_name",
      "users.avatar_url",
      "users.is_online",
      "users.email",
      "users.phone",
      "users.created_at",
      "instructor_profiles.expertise",
      "instructor_profiles.experience",
      "instructor_profiles.pricing",
      "instructor_profiles.demo_video_url"
    );
};

exports.getInstructorAvailability = async (id) => {
  const [profile] = await db("instructor_profiles")
    .where({ user_id: id })
    .select("availability");

  let availability = [];
  if (profile && profile.availability) {
    try {
      availability = JSON.parse(profile.availability);
    } catch (_) {
      availability = [];
    }
  }
  return availability;
};
