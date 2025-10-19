const db = require("../../config/database");
const {
  MODULE_ORDER,
  SYNTHETIC_PLAN_FEATURES,
  parseFeatureValue,
  serializeFeatureValue,
  getFeaturePresentation,
} = require("./planFeatureMetadata");

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

  const rawClasses = await db("online_classes")
    .select(
      "id",
      "title",
      "slug",
      "cover_image",
      "start_date",
      "end_date",
      "price",
      "access_type",
      "included_plans"
    )
    .whereRaw("included_plans <> '[]'::jsonb");

  const classesByPlan = {};
  rawClasses.forEach((cls) => {
    let planIds = [];
    if (Array.isArray(cls.included_plans)) planIds = cls.included_plans;
    else if (cls.included_plans) {
      try {
        const parsed = JSON.parse(cls.included_plans);
        planIds = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        planIds = [];
      }
    }
    planIds.forEach((planId) => {
      if (!classesByPlan[planId]) classesByPlan[planId] = [];
      classesByPlan[planId].push({
        id: cls.id,
        title: cls.title,
        slug: cls.slug,
        cover_image: cls.cover_image,
        start_date: cls.start_date,
        end_date: cls.end_date,
        price: cls.price,
        access_type: cls.access_type,
      });
    });
  });

  const modulePriority = (module) => {
    if (!module) return MODULE_ORDER.length;
    const idx = MODULE_ORDER.indexOf(module);
    return idx === -1 ? MODULE_ORDER.length : idx;
  };

  return plans.map((plan) => {
    const formattedFeatures = features
      .filter((f) => f.plan_id === plan.id)
      .map((feature) => {
        const parsedValue = parseFeatureValue(feature.value);
        const presentation = getFeaturePresentation(
          feature.feature_key,
          parsedValue
        );
        const valueString =
          presentation.displayValue === null || presentation.displayValue === undefined
            ? ""
            : typeof presentation.displayValue === "string"
              ? presentation.displayValue
              : String(presentation.displayValue);
        const description =
          feature.description && feature.description.trim()
            ? feature.description
            : presentation.description && presentation.description.trim()
              ? presentation.description
              : valueString;

        return {
          ...feature,
          value: valueString,
          description,
          label: presentation.label,
          module: presentation.module,
          raw_value: feature.value,
          parsed_value: parsedValue,
          source: "database",
        };
      });

    const syntheticFeatures = SYNTHETIC_PLAN_FEATURES.filter((def) =>
      def.roles.includes(plan.target_role)
    )
      .map((def) => {
        const built = def.build(plan);
        if (!built) return null;
        const valueString =
          built.value === null || built.value === undefined
            ? ""
            : typeof built.value === "string"
              ? built.value
              : String(built.value);
        const description =
          built.description && built.description.trim()
            ? built.description
            : valueString;
        return {
          id: `synthetic:${plan.id}:${def.key}`,
          plan_id: plan.id,
          feature_key: def.key,
          value: valueString,
          description,
          label: def.label,
          module: def.module,
          raw_value: built.raw ?? null,
          parsed_value: built.parsed ?? built.raw ?? null,
          source: "computed",
        };
      })
      .filter(Boolean);

    const combined = [...formattedFeatures, ...syntheticFeatures].sort((a, b) => {
      const moduleDiff = modulePriority(a.module) - modulePriority(b.module);
      if (moduleDiff !== 0) return moduleDiff;
      return a.label.localeCompare(b.label);
    });

    return {
      ...plan,
      features: combined,
      included_classes: classesByPlan[plan.id] || [],
    };
  });
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
      const rows = features
        .filter((f) => f && f.feature_key)
        .map((f) => {
          const parsedValue = parseFeatureValue(f.value);
          const storedValue = serializeFeatureValue(parsedValue);
          const presentation = getFeaturePresentation(
            f.feature_key,
            parsedValue
          );
          const description =
            f.description && f.description.trim()
              ? f.description
              : presentation.description;

          return {
            plan_id: planId,
            feature_key: f.feature_key,
            value: storedValue,
            description: description || null,
          };
        });
      if (rows.length) {
        await trx("plan_features").insert(rows);
      }
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
