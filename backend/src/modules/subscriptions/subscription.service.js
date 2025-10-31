const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const planService = require("../plans/plans.service");

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
        .update({
          start_date: start,
          end_date: end,
          status: "active",
          renewal_notice_sent_at: null,
          expiry_notice_sent_at: null,
        })
        .returning("*");
      return row;
    } else {
      const [row] = await trx("user_subscriptions")
        .insert({
          id: uuidv4(),
          user_id,
          plan_id,
          start_date: start,
          end_date: end,
          status: "active",
          renewal_notice_sent_at: null,
          expiry_notice_sent_at: null,
        })
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

  if (role) {
    query.andWhereRaw("LOWER(p.target_role) = ?", [String(role).toLowerCase()]);
  }

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
      .update({
        end_date: end,
        renewal_notice_sent_at: null,
        expiry_notice_sent_at: null,
      })
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

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

exports.getPlanSummaryForUser = async (user_id) => {
  const now = new Date();
  const subscription = await db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .select(
      "us.*",
      "p.name",
      "p.slug",
      "p.target_role",
      "p.price_monthly",
      "p.price_yearly",
      "p.currency",
      "p.max_courses",
      "p.ad_credits"
    )
    .where("us.user_id", user_id)
    .andWhere("us.status", "active")
    .andWhere("us.end_date", ">", now)
    .orderBy("us.end_date", "desc")
    .first();

  if (!subscription) return null;

  const plan = await planService.getPlanById(subscription.plan_id);

  const featureMap = plan?.feature_map || {};
  const adsMaxEntry = featureMap["ads_max_ads"] || {};
  const adsDurationEntry = featureMap["ads_max_duration"] || {};
  const adsBrandingEntry = featureMap["ads_allow_branding"] || {};
  const adsAnalyticsEntry = featureMap["ads_show_analytics"] || {};

  const maxActiveAds = toNumberOrNull(adsMaxEntry.value ?? adsMaxEntry.raw);
  const maxAdDurationDays = toNumberOrNull(
    adsDurationEntry.value ?? adsDurationEntry.raw
  );
  const allowBranding = Boolean(
    adsBrandingEntry.value ?? adsBrandingEntry.raw
  );
  const showAnalytics = Boolean(
    adsAnalyticsEntry.value ?? adsAnalyticsEntry.raw
  );

  const [{ count: activeAdsCountRaw } = { count: 0 }] = await db("ads")
    .where({ created_by: user_id, is_active: true })
    .count("* as count");
  const activeAds = Number(activeAdsCountRaw) || 0;

  const [{ count: totalAdsRaw } = { count: 0 }] = await db("ads")
    .where({ created_by: user_id })
    .count("* as count");
  const totalAds = Number(totalAdsRaw) || 0;

  const [{ count: publishedClassesRaw } = { count: 0 }] = await db(
    "online_classes"
  )
    .where({ instructor_id: user_id, status: "published" })
    .count("* as count");
  const publishedClasses = Number(publishedClassesRaw) || 0;

  const [{ count: totalClassesRaw } = { count: 0 }] = await db(
    "online_classes"
  )
    .where({ instructor_id: user_id })
    .count("* as count");
  const totalClasses = Number(totalClassesRaw) || 0;

  const adCreditsTotal = toNumberOrNull(plan?.ad_credits);
  let adCreditsRemaining = null;
  let adCreditsUsed = null;

  if (adCreditsTotal !== null) {
    adCreditsRemaining = await planService.getRemainingAdCredits(
      plan,
      user_id
    );
    if (adCreditsRemaining !== null) {
      adCreditsUsed = Math.max(
        adCreditsTotal - (Number(adCreditsRemaining) || 0),
        0
      );
    }
  }

  const maxCourses = toNumberOrNull(plan?.max_courses);
  const remainingClassSlots =
    maxCourses !== null
      ? Math.max(maxCourses - publishedClasses, 0)
      : null;

  const summaryPlan = plan
    ? {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        currency: plan.currency,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        max_courses: plan.max_courses,
        ad_credits: plan.ad_credits,
        feature_map: featureMap,
        feature_sections: plan.feature_sections || [],
      }
    : null;

  return {
    subscription: {
      id: subscription.id,
      plan_id: subscription.plan_id,
      status: subscription.status,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      interval: subscription.interval || null,
      role: subscription.target_role || plan?.target_role || null,
    },
    plan: summaryPlan,
    usage: {
      total_ads: totalAds,
      active_ads: activeAds,
      max_active_ads: maxActiveAds,
      max_ad_duration_days: maxAdDurationDays,
      allow_branding: allowBranding,
      show_analytics: showAnalytics,
      ad_credits_total: adCreditsTotal,
      ad_credits_remaining:
        adCreditsRemaining !== null
          ? Number(adCreditsRemaining)
          : null,
      ad_credits_used: adCreditsUsed,
      total_classes: totalClasses,
      published_classes: publishedClasses,
      max_active_classes: maxCourses,
      remaining_class_slots: remainingClassSlots,
    },
  };
};

const differenceInDays = (start, end) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
};

const inferIntervalFromDates = (start, end) => {
  const days = differenceInDays(start, end);
  if (days === null) return null;
  if (days >= 335) return "yearly";
  if (days >= 27 && days <= 62) return "monthly";
  return null;
};

exports.getPlanHistoryForUser = async (user_id) => {
  const rows = await db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .select(
      "us.id",
      "us.plan_id",
      "us.status",
      "us.start_date",
      "us.end_date",
      "us.created_at",
      "us.updated_at",
      "us.renewal_notice_sent_at",
      "us.expiry_notice_sent_at",
      "p.name",
      "p.slug",
      "p.currency",
      "p.price_monthly",
      "p.price_yearly",
      "p.target_role"
    )
    .where("us.user_id", user_id)
    .orderBy("us.start_date", "desc");

  const now = new Date();
  return rows.map((row) => {
    const start = row.start_date ? new Date(row.start_date) : null;
    const end = row.end_date ? new Date(row.end_date) : null;
    let computedStatus = row.status || "inactive";
    if (computedStatus === "active" && end && end < now) {
      computedStatus = "expired";
    } else if (
      (computedStatus === "cancelled" || computedStatus === "inactive") &&
      end &&
      end > now
    ) {
      computedStatus = "cancelled";
    }
    const interval = inferIntervalFromDates(start, end);
    const isCurrent =
      computedStatus === "active" && (!end || end >= now);

    return {
      id: row.id,
      plan_id: row.plan_id,
      plan_name: row.name,
      plan_slug: row.slug,
      currency: row.currency,
      price_monthly: row.price_monthly,
      price_yearly: row.price_yearly,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      computed_status: computedStatus,
      interval,
      target_role: row.target_role,
      is_current: isCurrent,
      created_at: row.created_at,
      updated_at: row.updated_at,
      renewal_notice_sent_at: row.renewal_notice_sent_at,
      expiry_notice_sent_at: row.expiry_notice_sent_at,
    };
  });
};
