const db = require("../../config/database");

// Convert comma separated or JSON strings to arrays
const parseArrayField = (val) => {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return String(val)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
};

exports.getPublicInstructors = async () => {
  const classRatings = db("class_reviews as cr")
    .join("online_classes as oc", "cr.class_id", "oc.id")
    .groupBy("oc.instructor_id")
    .select("oc.instructor_id", db.raw("AVG(cr.rating) as class_rating"));

  const tutorialRatings = db("tutorial_reviews as tr")
    .join("tutorials as t", "tr.tutorial_id", "t.id")
    .groupBy("t.instructor_id")
    .select("t.instructor_id", db.raw("AVG(tr.rating) as tutorial_rating"));

  const rows = await db("users")
    .join("instructor_profiles", "users.id", "instructor_profiles.user_id")
    .leftJoin(classRatings.as("cr"), "cr.instructor_id", "users.id")
    .leftJoin(tutorialRatings.as("tr"), "tr.instructor_id", "users.id")
    .whereRaw("LOWER(users.role) = ?", ["instructor"])
    .andWhere({ "users.status": "active" })
    .select(
      "users.id",
      "users.full_name",
      "users.avatar_url",
      "users.is_online",
      "instructor_profiles.expertise",
      "instructor_profiles.experience",
      "instructor_profiles.bio",
      "instructor_profiles.pricing",
      "instructor_profiles.demo_video_url",
      db.raw("COALESCE(cr.class_rating, 0) as class_rating"),
      db.raw("COALESCE(tr.tutorial_rating, 0) as tutorial_rating")
    )
    .orderBy("users.created_at", "desc");

  return rows.map((r) => {
    const ratings = [];
    if (r.class_rating) ratings.push(parseFloat(r.class_rating));
    if (r.tutorial_rating) ratings.push(parseFloat(r.tutorial_rating));
    const avg = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;
    return {
      ...r,
      expertise: parseArrayField(r.expertise),
      rating: avg,
    };
  });
};

exports.getPublicInstructor = async (id) => {
  const classRatings = db("class_reviews as cr")
    .join("online_classes as oc", "cr.class_id", "oc.id")
    .where("oc.instructor_id", id)
    .avg({ rating: "cr.rating" })
    .first();

  const tutorialRatings = db("tutorial_reviews as tr")
    .join("tutorials as t", "tr.tutorial_id", "t.id")
    .where("t.instructor_id", id)
    .avg({ rating: "tr.rating" })
    .first();

  const row = await db("users")
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
      "instructor_profiles.bio",
      "instructor_profiles.pricing",
      "instructor_profiles.demo_video_url"
    );

  if (row) {
    row.expertise = parseArrayField(row.expertise);
    const ratings = [];
    if (classRatings && classRatings.rating)
      ratings.push(parseFloat(classRatings.rating));
    if (tutorialRatings && tutorialRatings.rating)
      ratings.push(parseFloat(tutorialRatings.rating));
    row.rating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;
  }
  return row;
};

exports.getInstructorAvailability = async (id) => {
  const [profile] = await db("instructor_profiles")
    .where({ user_id: id })
    .select("availability_slots");

  let availability = [];
  if (profile && profile.availability_slots) {
    try {
      availability = JSON.parse(profile.availability_slots);
    } catch (_) {
      availability = [];
    }
  }
  return availability;
};
