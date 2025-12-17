const db = require("../../config/database");

// Map of instructor-only plan features and where they are enforced
// max_courses -> enforced on class creation/publishing
// ad_credits  -> enforced on ad creation
exports.INSTRUCTOR_FEATURE_VALIDATIONS = {
  max_courses: "classes",
  ad_credits: "ads",
};

// Fetch the active plan for an instructor, if any
exports.getActiveInstructorPlan = async (userId) => {
  const sub = await db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .select("p.*", "us.end_date", "us.id as subscription_id")
    .where({ "us.user_id": userId, "us.status": "active" })
    .where("p.target_role", "instructor")
    .first();
  if (!sub) return null;
  if (sub.end_date && new Date(sub.end_date) < new Date()) return null;
  return sub;
};
