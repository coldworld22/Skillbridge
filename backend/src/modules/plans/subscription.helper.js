const db = require("../../config/database");

exports.hasActiveStudentSubscription = async (userId) => {
  const sub = await db("user_subscriptions")
    .where({ user_id: userId })
    .where({ status: "active" })
    .first();
  if (!sub) return false;
  if (sub.end_date && new Date(sub.end_date) < new Date()) return false;
  return true;
};

