const db = require("../../config/database");

exports.createPlan = async (data) => {
  const [row] = await db("plans").insert(data).returning("*");
  return row;
};

exports.findBySlug = (slug) => db("plans").where({ slug }).first();

exports.getPlans = async () => {
  const plans = await db("plans").select("*").orderBy("id");
  const features = await db("plan_features").select("*");
  return plans.map((p) => ({
    ...p,
    features: features.filter((f) => f.plan_id === p.id),
  }));
};

exports.getPlanById = async (id) => {
  const plan = await db("plans").where({ id }).first();
  if (!plan) return null;
  const feats = await db("plan_features").where({ plan_id: id }).select("*");
  plan.features = feats;
  return plan;
};

exports.updatePlan = async (id, data) => {
  const [row] = await db("plans").where({ id }).update(data).returning("*");
  return row;
};

exports.deletePlan = (id) => db("plans").where({ id }).del();

exports.setFeatures = async (planId, features = []) => {
  await db("plan_features").where({ plan_id: planId }).del();
  if (features.length) {
    const rows = features.map((f) => ({
      plan_id: planId,
      feature_key: f.feature_key,
      value: f.value,
      description: f.description || null,
    }));
    await db("plan_features").insert(rows);
  }
  return db("plan_features").where({ plan_id: planId }).select("*");
};
