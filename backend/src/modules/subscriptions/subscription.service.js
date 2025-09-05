const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const addInterval = (date, interval) => {
  const d = new Date(date);
  if (interval === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
};

exports.createOrRenewSubscription = async ({ user_id, plan_id, interval }) => {
  return db.transaction(async (trx) => {
    const existing = await trx("user_subscriptions")
      .where({ user_id, plan_id })
      .orderBy("end_date", "desc")
      .first();
    const now = new Date();
    let start = now;
    let base = now;
    if (existing && existing.end_date && new Date(existing.end_date) > now) {
      start = existing.start_date;
      base = new Date(existing.end_date);
    }
    const end = addInterval(base, interval);
    if (existing) {
      const [row] = await trx("user_subscriptions")
        .where({ id: existing.id })
        .update({ start_date: start, end_date: end, status: "active" })
        .returning("*");
      return row;
    } else {
      const [row] = await trx("user_subscriptions")
        .insert({ id: uuidv4(), user_id, plan_id, start_date: start, end_date: end, status: "active" })
        .returning("*");
      return row;
    }
  });
};

exports.getActiveByUser = (user_id, role) => {
  const now = new Date();
  const query = db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .select("us.*", "p.name", "p.slug")
    .where("us.user_id", user_id)
    .andWhere("us.status", "active")
    .andWhere("us.end_date", ">", now);

  if (role) query.where("p.target_role", role);

  return query;
};

exports.upgradeSubscription = async (user_id) => {
  return db.transaction(async (trx) => {
    const existing = await trx("user_subscriptions")
      .where({ user_id, status: "active" })
      .orderBy("end_date", "desc")
      .first();
    if (!existing) return null;
    const end = addInterval(existing.end_date || new Date(), "yearly");
    const [row] = await trx("user_subscriptions")
      .where({ id: existing.id })
      .update({ end_date: end })
      .returning("*");
    return row;
  });
};

exports.cancelSubscription = async (user_id) => {
  const [row] = await db("user_subscriptions")
    .where({ user_id, status: "active" })
    .update({ status: "cancelled", end_date: new Date() })
    .returning("*");
  return row;
};
