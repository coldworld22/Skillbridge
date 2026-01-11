const db = require("../config/database");
const logger = require("../utils/logger");

const SEAT_FEATURES = [
  {
    featureKey: "max_users",
    roles: ["tenant_admin", "instructor", "student"],
  },
  {
    featureKey: "max_instructors",
    roles: ["instructor"],
  },
];

const normalizeOverrideEntry = (featureKey, value) => {
  if (!featureKey) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") {
    return {
      feature_key: featureKey,
      limit_type: "boolean",
      enabled: value,
    };
  }
  if (typeof value === "number") {
    return {
      feature_key: featureKey,
      limit_type: "count",
      limit_value: value,
    };
  }
  if (typeof value === "object") {
    const limitType = value.limit_type || value.limitType;
    const limitValue =
      value.limit_value !== undefined ? value.limit_value : value.limitValue;
    const enabled = value.enabled;
    if (!limitType && limitValue === undefined && enabled === undefined) {
      return null;
    }
    return {
      feature_key: featureKey,
      limit_type: limitType || (enabled !== undefined ? "boolean" : "count"),
      limit_value: limitValue,
      enabled,
    };
  }
  return null;
};

const normalizeFeatureOverrides = (rawOverrides) => {
  if (!rawOverrides) return [];
  if (Array.isArray(rawOverrides)) {
    return rawOverrides
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const featureKey = entry.feature_key || entry.featureKey;
        return normalizeOverrideEntry(featureKey, entry);
      })
      .filter(Boolean);
  }
  if (typeof rawOverrides === "object") {
    return Object.entries(rawOverrides)
      .map(([key, value]) => normalizeOverrideEntry(key, value))
      .filter(Boolean);
  }
  return [];
};

const upsertUsageCounter = async (tenantId, featureKey, value, trx) => {
  if (!featureKey) return;
  const payload = {
    tenant_id: tenantId,
    feature_key: featureKey,
    current_value: Number(value) || 0,
  };
  const query = trx || db;
  await query("usage_counters")
    .insert(payload)
    .onConflict(["tenant_id", "feature_key"])
    .merge({
      current_value: payload.current_value,
      updated_at: query.fn.now(),
    });
};

const syncSeatUsage = async (tenantId, trx) => {
  const query = trx || db;
  const results = [];
  for (const seat of SEAT_FEATURES) {
    const row = await query("tenant_memberships")
      .where({ tenant_id: tenantId, status: "active" })
      .whereIn("role", seat.roles)
      .count("* as c")
      .first();
    const count = parseInt(row?.c, 10) || 0;
    await upsertUsageCounter(tenantId, seat.featureKey, count, query);
    results.push({ feature_key: seat.featureKey, count });
  }
  return results;
};

const syncFeatureOverrides = async (tenantId, overrides, trx) => {
  if (!overrides.length) return 0;
  const query = trx || db;
  const seen = new Set();
  const rows = overrides
    .map((override) => {
      if (!override?.feature_key) return null;
      const key = override.feature_key;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        tenant_id: tenantId,
        feature_key: key,
        limit_type: override.limit_type,
        limit_value: override.limit_value ?? null,
        enabled:
          override.limit_type === "boolean"
            ? override.enabled ?? false
            : null,
      };
    })
    .filter(Boolean);

  if (!rows.length) return 0;

  await query("feature_overrides")
    .insert(rows)
    .onConflict(["tenant_id", "feature_key"])
    .merge({
      limit_type: query.raw("EXCLUDED.limit_type"),
      limit_value: query.raw("EXCLUDED.limit_value"),
      enabled: query.raw("EXCLUDED.enabled"),
    });
  return rows.length;
};

const getSubscriptionSnapshot = async (tenantId) => {
  if (!tenantId) return null;
  const subscription = await db("subscriptions as s")
    .leftJoin("plans as p", "p.id", "s.plan_id")
    .select(
      "s.tenant_id",
      "s.plan_id",
      "s.state",
      "s.meta",
      "p.features as plan_features",
    )
    .where("s.tenant_id", tenantId)
    .first();
  return subscription || null;
};

const syncTenantSubscriptionState = async (tenantId) => {
  if (!tenantId) return { tenantId, updated: false, reason: "tenant_missing" };
  const subscription = await getSubscriptionSnapshot(tenantId);
  if (!subscription) {
    return { tenantId, updated: false, reason: "subscription_missing" };
  }

  return db.transaction(async (trx) => {
    const tenant = await trx("tenants")
      .select("status", "plan_id")
      .where({ id: tenantId })
      .first();

    const updates = {};
    if (tenant?.status !== subscription.state) {
      updates.status = subscription.state;
    }
    if (tenant?.plan_id !== subscription.plan_id) {
      updates.plan_id = subscription.plan_id;
    }

    if (Object.keys(updates).length) {
      updates.updated_at = trx.fn.now();
      await trx("tenants").where({ id: tenantId }).update(updates);
    }

    const seatCounts = await syncSeatUsage(tenantId, trx);

    const overrides = normalizeFeatureOverrides(
      subscription?.meta?.feature_overrides ||
        subscription?.meta?.featureOverrides ||
        null,
    );
    const overrideCount = await syncFeatureOverrides(
      tenantId,
      overrides,
      trx,
    );

    return {
      tenantId,
      updated: Object.keys(updates).length > 0,
      status: subscription.state,
      plan_id: subscription.plan_id,
      seatCounts,
      overridesUpdated: overrideCount,
    };
  });
};

const replayTenantSubscriptions = async ({ tenantId = null } = {}) => {
  if (tenantId) {
    return {
      results: [await syncTenantSubscriptionState(tenantId)],
    };
  }

  const subscriptions = await db("subscriptions").select("tenant_id");
  const results = [];
  for (const sub of subscriptions) {
    try {
      results.push(await syncTenantSubscriptionState(sub.tenant_id));
    } catch (err) {
      logger.warn?.("failed to sync subscription", {
        tenantId: sub.tenant_id,
        error: err.message,
      });
      results.push({
        tenantId: sub.tenant_id,
        updated: false,
        reason: "sync_failed",
      });
    }
  }
  return { results };
};

module.exports = {
  getSubscriptionSnapshot,
  syncTenantSubscriptionState,
  replayTenantSubscriptions,
};
