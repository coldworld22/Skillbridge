// 📁 src/middleware/storage.js
// Tracks storage usage per tenant and enforces storage_bytes limits.

const db = require("../config/database");
const logger = require("../utils/logger");
const { sendQuotaExceeded } = require("../utils/quota");

async function getStorageLimit(tenantId) {
  const sub = await db("subscriptions as s")
    .leftJoin("plans as p", "p.id", "s.plan_id")
    .select("p.features as plan_features")
    .where("s.tenant_id", tenantId)
    .first();

  const override = await db("feature_overrides")
    .where({ tenant_id: tenantId, feature_key: "storage_bytes" })
    .first();
  if (override && override.limit_value != null) {
    return Number(override.limit_value);
  }
  return Number(sub?.plan_features?.storage_bytes) || 0;
}

async function getStorageUsage(tenantId) {
  const row = await db("usage_counters")
    .where({ tenant_id: tenantId, feature_key: "storage_bytes" })
    .first();
  return Number(row?.current_value) || 0;
}

async function addStorageUsage(tenantId, deltaBytes) {
  if (!deltaBytes || deltaBytes <= 0) return;
  await db("usage_counters")
    .insert({
      tenant_id: tenantId,
      feature_key: "storage_bytes",
      current_value: deltaBytes,
    })
    .onConflict(["tenant_id", "feature_key"])
    .merge({
      current_value: db.raw("usage_counters.current_value + ?", [deltaBytes]),
      updated_at: db.fn.now(),
    });
}

async function subtractStorageUsage(tenantId, deltaBytes) {
  if (!deltaBytes || deltaBytes <= 0) return;
  await db("usage_counters")
    .insert({
      tenant_id: tenantId,
      feature_key: "storage_bytes",
      current_value: 0,
    })
    .onConflict(["tenant_id", "feature_key"])
    .merge({
      current_value: db.raw("GREATEST(usage_counters.current_value - ?, 0)", [
        deltaBytes,
      ]),
      updated_at: db.fn.now(),
    });
}

function fileSizeBytes(filePath) {
  try {
    const stat = require("fs").statSync(filePath);
    if (stat.isFile()) return stat.size || 0;
  } catch (_err) {
    // ignore missing files
  }
  return 0;
}

function sumUploadedBytes(req) {
  let total = 0;
  if (Array.isArray(req.files)) {
    total = req.files.reduce((acc, file) => acc + (file?.size || 0), 0);
  } else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((arr) => {
      if (Array.isArray(arr)) {
        total += arr.reduce((acc, file) => acc + (file?.size || 0), 0);
      }
    });
  } else if (req.file) {
    total = req.file.size || 0;
  }
  return total;
}

/**
 * Middleware to check storage limit and record usage for uploaded files.
 * Assumes multer has already populated req.files/req.file.
 */
const checkAndConsumeStorage = () => {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) return res.status(400).json({ error: "tenant_not_set" });

      const uploadBytes = sumUploadedBytes(req);
      if (!uploadBytes) return next();

      const limit = await getStorageLimit(tenantId);
      if (!limit)
        return res.status(403).json({ error: "storage_limit_missing" });

      const used = await getStorageUsage(tenantId);
      if (used + uploadBytes > limit) {
        return sendQuotaExceeded(res, {
          feature: "storage_bytes",
          usage: used,
          limit,
          attempt: uploadBytes,
        });
      }

      await addStorageUsage(tenantId, uploadBytes);
      return next();
    } catch (err) {
      logger.warn?.("storage check failed", { error: err.message });
      return res.status(500).json({ error: "storage_check_failed" });
    }
  };
};

module.exports = {
  checkAndConsumeStorage,
  sumUploadedBytes,
  getStorageUsage,
  addStorageUsage,
};
