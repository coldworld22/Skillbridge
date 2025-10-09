const db = require("../../config/database");

exports.createPlan = async (data) => {
  const insertData = {
    ...data,
    max_courses: data.max_courses ?? null,
    ad_credits: data.ad_credits ?? 0,
  };
  const [row] = await db("plans").insert(insertData).returning("*");
  return row;
};

exports.findBySlug = (slug) => db("plans").where({ slug }).first();

exports.getPlans = async (role) => {
  let query = db("plans").select("*").orderBy("id");
  if (role) query = query.where({ target_role: role });
  const plans = await query;
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

// Decrement available ad credits for a plan
exports.consumeAdCredit = async (planId, trx) => {
  if (!planId) return;
  const query = trx || db;
  await query("plans")
    .where({ id: planId })
    .andWhere("ad_credits", ">", 0)
    .decrement("ad_credits", 1);
};

exports.updatePlan = async (id, data) => {
  const updateData = { ...data };
  if (data.max_courses !== undefined) updateData.max_courses = data.max_courses;
  if (data.ad_credits !== undefined) updateData.ad_credits = data.ad_credits;
  const [row] = await db("plans").where({ id }).update(updateData).returning("*");
  return row;
};

exports.deletePlan = (id) => db("plans").where({ id }).del();

exports.setFeatures = async (planId, features = []) => {
  return db.transaction(async (trx) => {
    await trx("plan_features").where({ plan_id: planId }).del();
    if (features.length) {
      const rows = features.map((f) => ({
        plan_id: planId,
        feature_key: f.feature_key,
        value: f.value,
        description: f.description || null,
      }));
      await trx("plan_features").insert(rows);
    }
    return trx("plan_features").where({ plan_id: planId }).select("*");
  });
};

exports.getPlanFeatures = async (prefix) => {
  const plans = await db("plans").select("id", "slug");
  let featureQuery = db("plan_features").select(
    "plan_id",
    "feature_key",
    "value"
  );
  if (prefix)
    featureQuery = featureQuery.where(
      "feature_key",
      "like",
      `${prefix}_%`
    );
  const features = await featureQuery;

  const result = {};
  const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

  const transformKey = (key) => {
    if (prefix && key.startsWith(`${prefix}_`)) {
      const suffix = key.slice(prefix.length + 1);
      if (prefix === "ads" && suffix === "max_duration") return "maxAdDuration";
      return toCamel(suffix);
    }
    return toCamel(key);
  };

  plans.forEach((plan) => {
    const feats = {};
    features
      .filter((f) => f.plan_id === plan.id)
      .forEach((f) => {
        const key = transformKey(f.feature_key);
        let val;
        try {
          val = JSON.parse(f.value);
        } catch {
          if (f.value === "true") val = true;
          else if (f.value === "false") val = false;
          else if (!isNaN(f.value)) val = Number(f.value);
          else val = f.value;
        }
        feats[key] = val;
      });
    result[plan.slug] = feats;
  });
  return result;
};

exports.getPlanIdentifiers = ({ role, includeInactive } = {}) => {
  const query = db("plans")
    .select("id", "slug", "name", "target_role", "active")
    .orderBy("name");

  if (!includeInactive) {
    query.where({ active: true });
  }

  if (role) {
    query.andWhereRaw("LOWER(target_role) = ?", [role.toLowerCase()]);
  }

  return query;
};
