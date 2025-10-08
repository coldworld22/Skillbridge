const db = require("../../config/database");

exports.hasActiveStudentSubscription = async (userId) => {
  const sub = await db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .where({ "us.user_id": userId, "us.status": "active" })
    .where("p.target_role", "student")
    .first();
  if (!sub) return false;
  if (sub.end_date && new Date(sub.end_date) < new Date()) return false;
  return true;
};

exports.getActiveStudentPlanId = async (userId) => {
  const sub = await db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .where({ "us.user_id": userId, "us.status": "active" })
    .where("p.target_role", "student")
    .first();
  if (!sub) return null;
  if (sub.end_date && new Date(sub.end_date) < new Date()) return null;
  return sub.plan_id;
};

exports.hasActiveInstructorSubscription = async (userId) => {
  const sub = await db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .where({ "us.user_id": userId, "us.status": "active" })
    .where("p.target_role", "instructor")
    .first();
  if (!sub) return false;
  if (sub.end_date && new Date(sub.end_date) < new Date()) return false;
  return true;
};

exports.getActiveInstructorPlanId = async (userId) => {
  const sub = await db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .where({ "us.user_id": userId, "us.status": "active" })
    .where("p.target_role", "instructor")
    .first();
  if (!sub) return null;
  if (sub.end_date && new Date(sub.end_date) < new Date()) return null;
  return sub.plan_id;
};

