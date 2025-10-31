const db = require("../../config/database");
const { groupContentByPlan } = require("./planContent.helper");
const { buildPlanIdLookup } = require("./planCoverage.helper");
const {
  parseFeatureValue,
  serializeFeatureValue,
  getFeaturePresentation,
  buildPlanFeatureBundle,
} = require("./planFeatureMetadata");

const AD_CREDIT_USAGE_TYPE = "ad_credit";

const isSubscriptionActive = (sub) => {
  if (!sub) return false;
  if (!sub.end_date) return true;
  return new Date(sub.end_date) > new Date();
};

const resolveActiveSubscriptionId = async (query, userId, planId) => {
  if (!userId || !planId || typeof query !== "function") return null;
  let builder;
  try {
    builder = query("user_subscriptions");
  } catch (err) {
    return null;
  }
  if (!builder) return null;

  const chain = (method, ...args) => {
    if (builder && typeof builder[method] === "function") {
      const result = builder[method](...args);
      if (result && typeof result.then === "function") {
        return builder;
      }
      builder = result || builder;
    }
    return builder;
  };

  chain("select", "id", "end_date");
  chain("where", {
    user_id: userId,
    plan_id: planId,
    status: "active",
  });
  chain("orderBy", "end_date", "desc");

  if (!builder || typeof builder.first !== "function") {
    return null;
  }

  try {
    const sub = await builder.first();
    if (!isSubscriptionActive(sub)) return null;
    return sub.id;
  } catch (_) {
    return null;
  }
};

const normalizeGroupedContent = (grouped = {}, lookup) => {
  if (!(lookup instanceof Map) || lookup.size === 0) {
    return grouped;
  }

  const resolved = new Map();

  Object.entries(grouped).forEach(([rawKey, items]) => {
    const candidate = `${rawKey}`.trim();
    if (!candidate) return;

    const planId =
      lookup.get(candidate) || lookup.get(candidate.toLowerCase());
    if (!planId) return;

    if (!resolved.has(planId)) {
      resolved.set(planId, new Map());
    }

    const bucket = resolved.get(planId);
    items.forEach((item) => {
      if (!item) return;
      const key =
        item.id !== undefined && item.id !== null
          ? `id:${item.id}`
          : item.slug
            ? `slug:${item.slug}`
            : `hash:${JSON.stringify(item)}`;
      if (!bucket.has(key)) {
        bucket.set(key, item);
      }
    });
  });

  const output = {};
  resolved.forEach((bucket, planId) => {
    const list = Array.from(bucket.values()).sort((a, b) => {
      const titleA = `${a.title || ""}`.toLowerCase();
      const titleB = `${b.title || ""}`.toLowerCase();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });
    output[planId] = list;
  });

  return output;
};

const collectIncludedContent = async (lookup) => {
  const [rawClasses, rawBooks, rawTutorials] = await Promise.all([
    db("online_classes")
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
      .whereRaw("included_plans <> '[]'::jsonb"),
    db("books")
      .select(
        "id",
        "title",
        "cover_image_url",
        "price",
        "status",
        "included_plans"
      )
      .whereRaw("included_plans <> '[]'::jsonb"),
    db("tutorials")
      .select(
        "id",
        "title",
        "slug",
        "cover_image",
        "price",
        "is_paid",
        "status",
        "included_plans"
      )
      .whereRaw("included_plans <> '[]'::jsonb"),
  ]);

  const classesByPlan = groupContentByPlan(rawClasses, (cls) => ({
    id: cls.id,
    title: cls.title,
    slug: cls.slug,
    cover_image: cls.cover_image,
    start_date: cls.start_date,
    end_date: cls.end_date,
    price: cls.price,
    access_type: cls.access_type,
  }));

  const booksByPlan = groupContentByPlan(rawBooks, (book) => ({
    id: book.id,
    title: book.title,
    cover_image_url: book.cover_image_url,
    price: book.price,
    status: book.status,
  }));

  const tutorialsByPlan = groupContentByPlan(rawTutorials, (tutorial) => ({
    id: tutorial.id,
    title: tutorial.title,
    slug: tutorial.slug,
    cover_image: tutorial.cover_image,
    price: tutorial.price,
    is_paid: tutorial.is_paid,
    status: tutorial.status,
  }));

  return {
    classesByPlan: normalizeGroupedContent(classesByPlan, lookup),
    booksByPlan: normalizeGroupedContent(booksByPlan, lookup),
    tutorialsByPlan: normalizeGroupedContent(tutorialsByPlan, lookup),
  };
};

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
  const lookup = buildPlanIdLookup(plans);

  const { classesByPlan, booksByPlan, tutorialsByPlan } =
    await collectIncludedContent(lookup);

  return plans.map((p) => {
    const planFeatures = features.filter((f) => f.plan_id === p.id);
    const { entries, sections, featureMap } = buildPlanFeatureBundle({
      ...p,
      features: planFeatures,
    });
    return {
      ...p,
      features: planFeatures,
      feature_entries: entries,
      feature_sections: sections,
      feature_map: featureMap,
      included_classes: classesByPlan[p.id] || [],
      included_books: booksByPlan[p.id] || [],
      included_tutorials: tutorialsByPlan[p.id] || [],
    };
  });
};

exports.getPlanById = async (id) => {
  const plan = await db("plans").where({ id }).first();
  if (!plan) return null;
  const feats = await db("plan_features").where({ plan_id: id }).select("*");
  const decoratedPlan = {
    ...plan,
    features: feats,
  };
  const { entries, sections, featureMap } = buildPlanFeatureBundle(
    decoratedPlan
  );
  const { classesByPlan, booksByPlan, tutorialsByPlan } =
    await collectIncludedContent(buildPlanIdLookup([decoratedPlan]));
  decoratedPlan.feature_entries = entries;
  decoratedPlan.feature_sections = sections;
  decoratedPlan.feature_map = featureMap;
  decoratedPlan.included_classes = classesByPlan[id] || [];
  decoratedPlan.included_books = booksByPlan[id] || [];
  decoratedPlan.included_tutorials = tutorialsByPlan[id] || [];
  return decoratedPlan;
};

const getAdCreditUsage = async (planId, userId, subscriptionId, trx) => {
  if (!planId || !userId) return 0;
  const query = trx || db;
  const criteria = {
    plan_id: planId,
    item_type: AD_CREDIT_USAGE_TYPE,
    item_id: String(userId),
  };
  if (subscriptionId) {
    criteria.subscription_id = subscriptionId;
  }

  const row = await query("plan_usage_metrics")
    .where(criteria)
    .first();
  return row ? Number(row.usage_count) || 0 : 0;
};

exports.getAdCreditUsage = getAdCreditUsage;

exports.getRemainingAdCredits = async (plan, userId, trx) => {
  if (!plan || plan.ad_credits === null || plan.ad_credits === undefined) {
    return null;
  }

  const allowance = Number(plan.ad_credits);
  if (!Number.isFinite(allowance) || allowance < 0) {
    return null;
  }
  if (allowance === 0) return 0;

  const query = trx || db;
  let subscriptionId = plan.active_subscription_id || null;
  if (!subscriptionId) {
    try {
      subscriptionId = await resolveActiveSubscriptionId(query, userId, plan.id);
    } catch (_) {
      subscriptionId = null;
    }
  }

  if (subscriptionId) {
    plan.active_subscription_id = subscriptionId;
  }

  const used = await getAdCreditUsage(
    plan.id,
    userId,
    subscriptionId,
    query
  );
  const remaining = allowance - used;
  return remaining < 0 ? 0 : remaining;
};

exports.consumeAdCredit = async ({
  planId,
  userId,
  allowance,
  subscriptionId,
  trx,
} = {}) => {
  if (!planId || !userId) {
    return { consumed: false, remaining: null };
  }

  const credits =
    allowance === null || allowance === undefined
      ? null
      : Number(allowance);

  if (credits === null || !Number.isFinite(credits)) {
    return { consumed: false, remaining: null };
  }

  const query = trx || db;
  const itemId = String(userId);

  let activeSubscriptionId = subscriptionId || null;
  if (!activeSubscriptionId) {
    try {
      activeSubscriptionId = await resolveActiveSubscriptionId(
        query,
        userId,
        planId
      );
    } catch (_) {
      activeSubscriptionId = null;
    }
  }

  const usageCriteria = {
    plan_id: planId,
    item_type: AD_CREDIT_USAGE_TYPE,
    item_id: itemId,
  };

  if (activeSubscriptionId) {
    usageCriteria.subscription_id = activeSubscriptionId;
  }

  const usageRow = await query("plan_usage_metrics")
    .where(usageCriteria)
    .first();

  const used = Number(usageRow?.usage_count) || 0;
  if (used >= credits) {
    return { consumed: false, remaining: 0 };
  }

  if (usageRow) {
    await query("plan_usage_metrics")
      .where(usageCriteria)
      .update({
        usage_count: used + 1,
      });
  } else {
    const payload = {
      plan_id: planId,
      item_type: AD_CREDIT_USAGE_TYPE,
      item_id: itemId,
      usage_count: 1,
    };
    if (activeSubscriptionId) {
      payload.subscription_id = activeSubscriptionId;
    }
    await query("plan_usage_metrics").insert(payload);
  }

  const remaining = credits - (used + 1);
  const response = {
    consumed: true,
    remaining: remaining < 0 ? 0 : remaining,
  };
  if (activeSubscriptionId) {
    response.subscriptionId = activeSubscriptionId;
  }
  return response;
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
