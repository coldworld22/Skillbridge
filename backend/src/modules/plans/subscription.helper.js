const db = require("../../config/database");

const toLower = (val) =>
  typeof val === "string" ? val.trim().toLowerCase() : val;

const isSubscriptionActive = (sub) => {
  if (!sub) return false;
  if (!sub.end_date) return true;
  return new Date(sub.end_date) > new Date();
};

const chainIfExists = (builder, method, ...args) => {
  if (!builder || typeof builder[method] !== "function") {
    return builder;
  }
  const result = builder[method](...args);
  if (result && typeof result.then === "function") {
    // Preserve builder chaining when the call returns a promise (e.g. select)
    return builder;
  }
  return result || builder;
};


const fetchActiveSubscription = async (userId, role) => {
  if (!userId) return null;

  let query = db;
  if (typeof db === "function") {
    try {
      query = db("user_subscriptions as us");
    } catch (_) {
      return null;
    }
  }
  query = chainIfExists(query, "join", "plans as p", "us.plan_id", "p.id");
  query = chainIfExists(
    query,
    "select",
    "us.id as subscription_id",
    "us.plan_id",
    "us.start_date",
    "us.end_date",
    "p.target_role"
  );
  query = chainIfExists(query, "where", "us.user_id", userId);
  query = chainIfExists(query, "andWhere", "us.status", "active");
  query = chainIfExists(query, "orderBy", "us.end_date", "desc");

  if (role) {
    query = chainIfExists(query, "andWhereRaw", "LOWER(p.target_role) = ?", [
      toLower(role),
    ]);
    query = chainIfExists(query, "where", "p.target_role", role);
  }

  const sub =
    typeof query?.first === "function" ? await query.first() : null;
  if (!isSubscriptionActive(sub)) return null;
  return sub;
};

exports.hasActiveStudentSubscription = async (userId) => {
  const sub = await fetchActiveSubscription(userId, "student");
  return Boolean(sub);
};

exports.getActiveStudentPlanId = async (userId) => {
  const sub = await fetchActiveSubscription(userId, "student");
  return sub ? sub.plan_id : null;
};

exports.getActiveStudentSubscription = (userId) =>
  fetchActiveSubscription(userId, "student");

exports.hasActiveInstructorSubscription = async (userId) => {
  const sub = await fetchActiveSubscription(userId, "instructor");
  return Boolean(sub);
};

exports.getActiveInstructorPlanId = async (userId) => {
  const sub = await fetchActiveSubscription(userId, "instructor");
  return sub ? sub.plan_id : null;
};

exports.getActiveInstructorSubscription = (userId) =>
  fetchActiveSubscription(userId, "instructor");

exports.getActiveSubscriptionForPlan = async (userId, planId) => {
  if (!userId || !planId) return null;
  const sub = await db("user_subscriptions")
    .select("id as subscription_id", "plan_id", "start_date", "end_date")
    .where({
      user_id: userId,
      plan_id: planId,
      status: "active",
    })
    .orderBy("end_date", "desc")
    .first();
  if (!isSubscriptionActive(sub)) return null;
  return sub;
};
