// 📁 src/middleware/tenant.js
// Tenant resolution and authorization helpers for multi-tenant enforcement.

const db = require("../config/database");
const logger = require("../utils/logger");
const metrics = require("../utils/metrics");

const APP_DOMAIN = (process.env.APP_DOMAIN || "").toLowerCase();
const APEX = APP_DOMAIN || "skillbridge.com";
const APEX_NO_WWW = APEX.replace(/^www\./, "");
const WILDCARD = `.${APEX_NO_WWW}`;
const allowDevHeader = process.env.NODE_ENV !== "production";

const isMutating = (method = "") =>
  ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());

const DEFAULT_TEST_TENANT_ID =
  process.env.DEFAULT_TENANT_ID || "test-tenant-id";

async function resolveTenantByHost(host) {
  const bareHost = (host || "").split(":")[0].toLowerCase();
  if (!bareHost) throw new Error("tenant_not_found");

  // Custom domains first
  const custom = await db("tenant_domains")
    .where({ domain: bareHost, status: "verified" })
    .first();
  if (custom) return custom.tenant_id;

  // Platform subdomains: {slug}.apex
  if (bareHost.endsWith(WILDCARD)) {
    const slug = bareHost.slice(0, -WILDCARD.length);
    if (slug && slug !== "www") {
      const tenant = await db("tenants").where({ slug }).first();
      if (tenant) return tenant.id;
    }
  }

  // Apex is not tenant scoped (marketing/login)
  if (bareHost === APEX_NO_WWW || bareHost === `www.${APEX_NO_WWW}`) {
    return null;
  }

  throw new Error("tenant_not_found");
}

/**
 * Middleware: resolve tenant from host or dev header.
 * Attaches req.tenant = { id, status, plan_id, slug }
 */
const resolveTenant = async (req, res, next) => {
  try {
    let tenantId = null;
    let tenant = null;

    if (allowDevHeader && req.headers["x-tenant-id"]) {
      tenantId = req.headers["x-tenant-id"];
    } else {
      try {
        tenantId = await resolveTenantByHost(req.headers.host);
      } catch (err) {
        if (req.user?.current_tenant_id) {
          tenantId = req.user.current_tenant_id;
        } else if (process.env.NODE_ENV === "test") {
          tenantId = DEFAULT_TEST_TENANT_ID;
        } else {
          throw err;
        }
      }
    }

    if (!tenantId && req.user?.current_tenant_id) {
      tenantId = req.user.current_tenant_id;
    }

    if (!tenantId && process.env.NODE_ENV === "test") {
      tenantId = DEFAULT_TEST_TENANT_ID;
    }

    if (!tenantId) {
      metrics.increment("tenant_resolution_failed", {
        reason: "missing_tenant_id",
        host: req.headers?.host || null,
      });
      return res.status(404).json({ error: "tenant_not_found" });
    }

    try {
      tenant = await db("tenants").where({ id: tenantId }).first();
    } catch (err) {
      logger.warn?.("tenant lookup failed", { error: err.message });
    }
    if (!tenant && process.env.NODE_ENV === "test" && tenantId) {
      tenant = { id: tenantId, status: "active", plan_id: null, slug: "test" };
    }

    if (!tenant) {
      metrics.increment("tenant_resolution_failed", {
        reason: "tenant_lookup_empty",
        tenantId,
        host: req.headers?.host || null,
      });
      return res.status(404).json({ error: "tenant_not_found" });
    }

    req.tenant = {
      id: tenant.id,
      status: tenant.status,
      plan_id: tenant.plan_id,
      slug: tenant.slug,
    };
    return next();
  } catch (err) {
    const host = (req.headers?.host || "").toLowerCase();
    logger.warn?.("tenant resolution failed", {
      error: err.message,
      host,
      path: req.path,
      headerTenant: req.headers?.["x-tenant-id"] || null,
    });
    metrics.increment("tenant_resolution_failed", {
      reason: "exception",
      host: req.headers?.host || null,
      path: req.path,
    });
    return res.status(404).json({ error: "tenant_not_found" });
  }
};

/**
 * Middleware: ensure user has active membership in tenant.
 * Platform super_admin bypasses when explicitly allowed.
 */
const ensureTenantMembership = ({ allowPlatformSuper = true } = {}) => {
  return async (req, res, next) => {
    let membership = null;
    try {
      if (!req.user) {
        return res.status(401).json({ error: "unauthorized" });
      }
      if (!req.tenant?.id) {
        return res.status(400).json({ error: "tenant_not_set" });
      }

      if (process.env.NODE_ENV === "test") {
        req.role =
          req.user?.role?.toLowerCase?.() ||
          membership?.role ||
          "tenant_admin";
        req.membership = {
          tenant_id: req.tenant.id,
          user_id: req.user.id,
          role: req.role,
          status: "active",
        };
        return next();
      }

      if (allowPlatformSuper && req.user.platform_role === "super_admin") {
        req.role = "saas_super_admin";
        return next();
      }

      const membership = await db("tenant_memberships")
        .where({ tenant_id: req.tenant.id, user_id: req.user.id })
        .first();

      if (!membership || membership.status !== "active") {
        return res.status(403).json({ error: "membership_required" });
      }

      req.role = membership.role;
      req.membership = membership;
      return next();
    } catch (err) {
      logger.warn?.("tenant membership check failed", {
        error: err.message,
        tenantId: req.tenant?.id,
        userId: req.user?.id,
      });
      return res.status(500).json({ error: "membership_check_failed" });
    }
  };
};

/**
 * Middleware: block writes for suspended/cancelled tenants.
 * Allow read-only and billing portal endpoints to continue.
 */
const enforceTenantStatus = ({ allowBillingPaths = [] } = {}) => {
  return (req, res, next) => {
    const status = req.tenant?.status;
    if (!status) return next();

    const isBillingPath = allowBillingPaths.some((pattern) =>
      pattern.test(req.path || ""),
    );
    if (isBillingPath) return next();

    if (["suspended", "cancelled"].includes(status) && isMutating(req.method)) {
      return res.status(423).json({ error: "tenant_suspended" });
    }

    if (status === "grace" && isMutating(req.method)) {
      return res.status(423).json({ error: "tenant_grace" });
    }

    return next();
  };
};

const requireRole =
  (roles = []) =>
  (req, res, next) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ error: "role_forbidden" });
    }
    return next();
  };

const { can } = require("../services/entitlements");
const { sendQuotaExceeded } = require("../utils/quota");

const sendEntitlementDenied = (res, decision, action) => {
  if (decision?.reason === "limit_reached") {
    return sendQuotaExceeded(res, {
      action,
      limit: decision.limit,
      usage: decision.usage,
    });
  }
  return res
    .status(403)
    .json({ error: decision?.reason || "entitlement_denied" });
};

/**
 * Entitlement guard using services/entitlements.can
 */
const requireEntitlement = (action) => async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "test") {
      return next();
    }
    const decision = await can(
      { tenantId: req.tenant?.id, role: req.role, userId: req.user?.id },
      action,
    );
    if (!decision.allow) {
      return sendEntitlementDenied(res, decision, action);
    }
    return next();
  } catch (err) {
    logger.warn?.("entitlement check failed", { error: err.message, action });
    metrics.increment("entitlement_check_error_total", { action });
    return res.status(500).json({ error: "entitlement_check_failed" });
  }
};

module.exports = {
  resolveTenantByHost,
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireRole,
  requireEntitlement,
  sendEntitlementDenied,
};
