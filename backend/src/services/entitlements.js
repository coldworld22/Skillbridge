// 📁 src/services/entitlements.js
// Entitlement checking for multi-tenant actions.
// This version uses plan.features JSONB and optional feature_overrides; quotas via counts.

const db = require("../config/database");
const logger = require("../utils/logger");

const ACTIONS = {
  "user.invite": {
    roles: ["tenant_admin"],
    feature: "max_users",
    quota: { table: "tenant_memberships", where: { status: "active" } },
    countRoles: ["tenant_admin", "instructor", "student"],
  },
  "instructor.add": {
    roles: ["tenant_admin"],
    feature: "max_instructors",
    quota: { table: "tenant_memberships", where: { status: "active" } },
    countRoles: ["instructor"],
  },
  "class.create": {
    roles: ["tenant_admin", "instructor"],
    feature: "max_classes",
    quota: { table: "online_classes" },
  },
  "class.update": {
    roles: ["tenant_admin", "instructor"],
  },
  "class.delete": {
    roles: ["tenant_admin", "instructor"],
  },
  "class.moderate": {
    roles: ["tenant_admin"],
  },
  // Books and categories (use dedicated features or reuse class limits)
  "book.create": {
    roles: ["tenant_admin", "instructor"],
    feature: "max_books",
    quota: { table: "books" },
  },
  "book.update": {
    roles: ["tenant_admin", "instructor"],
  },
  "book.delete": {
    roles: ["tenant_admin", "instructor"],
  },
  "book.category.create": {
    roles: ["tenant_admin"],
    feature: "max_book_categories",
    quota: { table: "book_categories" },
  },
  "book.category.update": {
    roles: ["tenant_admin"],
  },
  "book.category.delete": {
    roles: ["tenant_admin"],
  },
  // Offers / marketplace
  "offer.create": {
    roles: ["tenant_admin", "instructor"],
    feature: "marketplace_enabled",
  },
  "offer.update": {
    roles: ["tenant_admin", "instructor"],
    feature: "marketplace_enabled",
  },
  "offer.delete": {
    roles: ["tenant_admin", "instructor"],
    feature: "marketplace_enabled",
  },
  // Assets/uploads (storage gating; adjust quota to your storage tracking)
  "asset.upload": {
    roles: ["tenant_admin", "instructor"],
    feature: "storage_bytes",
    quota: { table: "assets" },
  },
  // Payouts
  "payout.request": {
    roles: ["tenant_admin"],
  },
  "payout.manage": {
    roles: ["tenant_admin"],
  },
  // Ads
  "ad.create": {
    roles: ["tenant_admin", "instructor"],
  },
  "ad.update": {
    roles: ["tenant_admin", "instructor"],
  },
  "ad.delete": {
    roles: ["tenant_admin", "instructor"],
  },
  // Coupons
  "coupon.create": {
    roles: ["tenant_admin", "instructor"],
  },
  "coupon.update": {
    roles: ["tenant_admin", "instructor"],
  },
  "coupon.delete": {
    roles: ["tenant_admin", "instructor"],
  },
  // Groups
  "group.create": {
    roles: ["tenant_admin", "instructor"],
  },
  "group.update": {
    roles: ["tenant_admin", "instructor"],
  },
  "group.delete": {
    roles: ["tenant_admin", "instructor"],
  },
  "group.manage": {
    roles: ["tenant_admin", "instructor"],
  },
  // Moderation
  "moderation.manage": {
    roles: ["tenant_admin"],
  },
  // Community discussions/replies
  "community.discussion.create": {
    roles: ["tenant_admin", "instructor", "student"],
  },
  "community.discussion.update": {
    roles: ["tenant_admin", "instructor"],
  },
  "community.discussion.delete": {
    roles: ["tenant_admin"],
  },
  "community.reply.create": {
    roles: ["tenant_admin", "instructor", "student"],
  },
  "community.reply.update": {
    roles: ["tenant_admin", "instructor"],
  },
  "community.reply.delete": {
    roles: ["tenant_admin"],
  },
  "community.tag.manage": {
    roles: ["tenant_admin"],
  },
  "community.announcement.manage": {
    roles: ["tenant_admin"],
  },
  "community.report.manage": {
    roles: ["tenant_admin"],
  },
  // Payments (bank/other)
  "payment.pay": {
    roles: ["student", "instructor", "tenant_admin"],
  },
  "payment.manage": {
    roles: ["tenant_admin"],
  },
  // SEO/Adsense/App config
  "config.seo.manage": {
    roles: ["tenant_admin"],
  },
  "config.adsense.manage": {
    roles: ["tenant_admin"],
  },
  "config.app.manage": {
    roles: ["tenant_admin"],
  },
  "config.email.manage": {
    roles: ["tenant_admin"],
  },
  "config.contact.manage": {
    roles: ["tenant_admin"],
  },
  "config.messages.manage": {
    roles: ["tenant_admin"],
  },
  "config.payment.manage": {
    roles: ["tenant_admin"],
  },
  "config.social.manage": {
    roles: ["tenant_admin"],
  },
  "config.analytics.manage": {
    roles: ["tenant_admin"],
  },
  "config.payment_methods.manage": {
    roles: ["tenant_admin"],
  },
  // Support/Tickets
  "support.ticket.create": {
    roles: ["tenant_admin", "instructor", "student"],
  },
  "support.ticket.update": {
    roles: ["tenant_admin", "instructor"],
  },
  "support.ticket.manage": {
    roles: ["tenant_admin"],
  },
  // Media streaming (optional gating)
  "media.stream": {
    roles: ["tenant_admin", "instructor", "student"],
  },
  // Blog & categories
  "blog.manage": {
    roles: ["tenant_admin"],
  },
  "category.manage": {
    roles: ["tenant_admin"],
  },
  "class.resource.manage": {
    roles: ["tenant_admin", "instructor"],
  },
  "payment.receipt.upload": {
    roles: ["student", "instructor", "tenant_admin"],
  },
  "user.asset.upload": {
    roles: ["tenant_admin", "instructor", "student"],
  },
};

const BLOCKED_STATES = new Set(["suspended", "cancelled"]);
const LIMITED_STATES = new Set(["grace"]);

async function getSubscriptionWithPlan(tenantId) {
  const sub = await db("subscriptions as s")
    .leftJoin("plans as p", "p.id", "s.plan_id")
    .select(
      "s.state",
      "s.trial_end",
      "s.period_end",
      "s.plan_id",
      "p.features as plan_features",
    )
    .where("s.tenant_id", tenantId)
    .first();
  return sub;
}

async function getFeatureValue(tenantId, featureKey, planFeatures) {
  // Overrides win; otherwise plan.features JSONB
  const override = await db("feature_overrides")
    .where({ tenant_id: tenantId, feature_key: featureKey })
    .first();
  if (override) {
    if (override.limit_type === "boolean") return override.enabled;
    return override.limit_value;
  }
  if (!planFeatures) return null;
  return planFeatures[featureKey];
}

async function getUsageCount(tenantId, quota, countRoles) {
  const table = quota.table;
  if (
    table === "tenant_memberships" &&
    Array.isArray(countRoles) &&
    countRoles.length
  ) {
    return db(table)
      .where({ tenant_id: tenantId })
      .whereIn("role", countRoles)
      .andWhere((qb) => {
        if (quota.where) qb.where(quota.where);
      })
      .count("* as c")
      .first()
      .then((row) => parseInt(row.c, 10) || 0);
  }
  return db(table)
    .where({ tenant_id: tenantId })
    .andWhere((qb) => {
      if (quota.where) qb.where(quota.where);
    })
    .count("* as c")
    .first()
    .then((row) => parseInt(row.c, 10) || 0);
}

function allow() {
  return { allow: true };
}
function deny(reason, meta = {}) {
  return { allow: false, reason, ...meta };
}

async function can({ tenantId, role, userId }, action) {
  const rule = ACTIONS[action];
  if (!rule) return deny("unknown_action");
  if (!role || !rule.roles.includes(role)) return deny("role_forbidden");

  const sub = await getSubscriptionWithPlan(tenantId);
  if (!sub) return deny("subscription_missing");

  if (BLOCKED_STATES.has(sub.state))
    return deny("subscription_blocked", { state: sub.state });
  if (LIMITED_STATES.has(sub.state) && isWriteAction(action)) {
    // customize behavior during grace; here we allow unless plan/limits block
  }

  if (rule.feature) {
    const featureValue = await getFeatureValue(
      tenantId,
      rule.feature,
      sub.plan_features || {},
    );
    if (featureValue === undefined || featureValue === null)
      return deny("feature_disabled");

    if (rule.quota) {
      const usage = await getUsageCount(tenantId, rule.quota, rule.countRoles);
      if (usage >= featureValue)
        return deny("limit_reached", { usage, limit: featureValue });
    }
  }

  return allow();
}

function isWriteAction(action) {
  // Adjust if you need finer control for grace state
  return true;
}

module.exports = {
  can,
  ACTIONS,
};
