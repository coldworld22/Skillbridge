// 📁 src/modules/users/admin/admin.service.js

const db = require("../../../config/database");

const safeParseJson = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const toCount = (value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toAmount = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const MONTH_WINDOW = 6;

const buildRecentMonthBuckets = (count = MONTH_WINDOW) => {
  const buckets = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = ref.toISOString().slice(0, 7); // YYYY-MM
    const label = ref.toLocaleString("default", { month: "short" });
    buckets.push({ key, label });
  }

  return buckets;
};

const normalizeMonthlySeries = (rows = [], { valueKey = "value", outputKey = "value" } = {}) => {
  const buckets = buildRecentMonthBuckets();
  const valueLookup = new Map();
  const labelLookup = new Map();
  let detectedCurrency = null;

  rows.forEach((row = {}) => {
    const key = row.month_key || row.monthKey || row.month;
    if (!key) return;

    const rawValue = Number(row[valueKey]);
    if (Number.isFinite(rawValue)) {
      valueLookup.set(String(key), rawValue);
    }

    if (row.month_label) {
      labelLookup.set(String(key), row.month_label);
    }

    if (!detectedCurrency && row.currency) {
      detectedCurrency = row.currency;
    }
  });

  return {
    currency: detectedCurrency || null,
    data: buckets.map(({ key, label }) => ({
      monthKey: key,
      month: labelLookup.get(key) || label,
      [outputKey]: valueLookup.get(key) || 0,
    })),
  };
};

/**
 * Fetch admin profile data by user_id
 * @param {string} userId
 */
exports.getAdminProfile = (userId) => {
  return db("admin_profiles").where({ user_id: userId }).first();
};

/**
 * Create or update admin profile details
 * @param {string} userId
 * @param {object} data - { gender, date_of_birth, avatar_url, identity_doc_url, etc. }
 */
exports.updateAdminProfile = async (userId, data) => {
  const exists = await db("admin_profiles").where({ user_id: userId }).first();

  const profileData = {
    ...data,
    updated_at: new Date(),
  };

  if (exists) {
    await db("admin_profiles").where({ user_id: userId }).update(profileData);
  } else {
    await db("admin_profiles").insert({
      user_id: userId,
      ...profileData,
      created_at: new Date(),
    });
  }
};

// ---------------------------------------------------------------------------
// 📊 Dashboard statistics for the main admin dashboard
// ---------------------------------------------------------------------------

exports.getDashboardStats = async () => {
  const [
    userRow,
    instructorRow,
    studentRow,
    tutorialRow,
    classRow,
    revenueRows,
    signupRows,
    categoryRows,
    instructorRows,
    planSubscriptionRows,
  ] = await Promise.all([
    db("users").count().first(),
    db("users").where({ role: "Instructor" }).count().first(),
    db("users").where({ role: "Student" }).count().first(),
    db("tutorials").count().first(),
    db("online_classes").count().first(),
    db("payments")
      .where({ status: "paid" })
      .where("created_at", ">=", db.raw("date_trunc('month', now()) - interval '5 months'"))
      .select(
        db.raw("TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month_key"),
        db.raw("TO_CHAR(date_trunc('month', created_at), 'Mon') as month_label"),
        db.raw("COALESCE(MAX(currency), 'USD') as currency")
      )
      .sum({ revenue: "amount" })
      .groupByRaw("date_trunc('month', created_at)")
      .orderByRaw("date_trunc('month', created_at)"),
    db("users")
      .where("created_at", ">=", db.raw("date_trunc('month', now()) - interval '5 months'"))
      .select(
        db.raw("TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month_key"),
        db.raw("TO_CHAR(date_trunc('month', created_at), 'Mon') as month_label")
      )
      .count("* as users")
      .groupByRaw("date_trunc('month', created_at)")
      .orderByRaw("date_trunc('month', created_at)"),
    db("tutorials as t")
      .leftJoin("categories as c", "t.category_id", "c.id")
      .select(db.raw("COALESCE(c.name, 'Uncategorized') as name"))
      .count("t.id as value")
      .groupBy("name")
      .orderBy("value", "desc"),
    db("tutorials as t")
      .leftJoin("users as u", "t.instructor_id", "u.id")
      .select("u.full_name as instructor")
      .count("t.id as tutorials")
      .groupBy("u.full_name")
      .orderBy("tutorials", "desc")
      .limit(10),
    db("plans as p")
      .leftJoin("user_subscriptions as us", "p.id", "us.plan_id")
      .select(
        "p.id",
        "p.name",
        "p.slug",
        "p.color",
        "p.style",
        "p.target_role",
        "p.price_monthly",
        "p.price_yearly",
        "p.currency",
        db.raw(`
          SUM(
            CASE
              WHEN us.status = 'active'
                AND (us.end_date IS NULL OR us.end_date > NOW())
              THEN 1 ELSE 0
            END
          ) AS active_subscribers
        `),
        db.raw(`
          SUM(
            CASE
              WHEN us.status = 'active'
                AND us.start_date >= date_trunc('month', NOW())
              THEN 1 ELSE 0
            END
          ) AS new_subscribers_this_month
        `),
        db.raw(`
          SUM(
            CASE
              WHEN us.status = 'active'
                AND us.end_date IS NOT NULL
                AND us.end_date BETWEEN NOW() AND NOW() + interval '30 days'
              THEN 1 ELSE 0
            END
          ) AS expiring_soon
        `),
        db.raw(`
          SUM(
            CASE
              WHEN us.status = 'cancelled'
                AND us.updated_at >= date_trunc('month', NOW())
              THEN 1 ELSE 0
            END
          ) AS cancelled_this_month
        `)
      )
      .groupBy(
        "p.id",
        "p.name",
        "p.slug",
        "p.color",
        "p.style",
        "p.target_role",
        "p.price_monthly",
        "p.price_yearly",
        "p.currency"
      )
      .orderBy("p.target_role")
      .orderBy("p.price_monthly"),
  ]);

  const revenueSeries = normalizeMonthlySeries(revenueRows, {
    valueKey: "revenue",
    outputKey: "revenue",
  });
  const signupSeries = normalizeMonthlySeries(signupRows, {
    valueKey: "users",
    outputKey: "users",
  });

  return {
    totalUsers: parseInt(userRow.count, 10) || 0,
    instructors: parseInt(instructorRow.count, 10) || 0,
    students: parseInt(studentRow.count, 10) || 0,
    tutorials: parseInt(tutorialRow.count, 10) || 0,
    classes: parseInt(classRow.count, 10) || 0,
    monthlyRevenue: revenueSeries.data,
    monthlyRevenueCurrency: revenueSeries.currency || "USD",
    monthlySignups: signupSeries.data,
    tutorialsByCategory: categoryRows.map((r) => ({
      name: r.name,
      value: parseInt(r.value, 10) || 0,
    })),
    instructorTutorialCount: instructorRows.map((r) => ({
      instructor: r.instructor,
      tutorials: parseInt(r.tutorials, 10) || 0,
    })),
    planSubscriptions: planSubscriptionRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      color: row.color,
      style: safeParseJson(row.style, null),
      targetRole: row.target_role,
      priceMonthly: toAmount(row.price_monthly),
      priceYearly: toAmount(row.price_yearly),
      currency: row.currency,
      subscribers: {
        active: toCount(row.active_subscribers),
        newThisMonth: toCount(row.new_subscribers_this_month),
        expiringSoon: toCount(row.expiring_soon),
        cancelledThisMonth: toCount(row.cancelled_this_month),
      },
    })),
  };
};
