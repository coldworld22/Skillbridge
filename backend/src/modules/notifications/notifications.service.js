const db = require("../../config/database");
const logger = require("../../utils/logger.js");

let hasTenantColumnPromise;
let hasTenantMembershipTablePromise;

const hasTenantColumn = async () => {
  if (!hasTenantColumnPromise) {
    hasTenantColumnPromise = db.schema.hasColumn("notifications", "tenant_id");
  }
  return hasTenantColumnPromise;
};

const hasTenantMembershipTable = async () => {
  if (!hasTenantMembershipTablePromise) {
    hasTenantMembershipTablePromise = db.schema.hasTable("tenant_memberships");
  }
  return hasTenantMembershipTablePromise;
};

const resolveTenantIdForUser = async (userId, tenantId) => {
  if (tenantId) return tenantId;
  if (!(await hasTenantMembershipTable())) return null;
  const membership = await db("tenant_memberships")
    .where({ user_id: userId, status: "active" })
    .orderBy("created_at")
    .first();
  return membership?.tenant_id || null;
};

exports.createNotification = async ({ user_id, type, message, tenant_id }) => {
  if (!user_id) {
    logger.warn("Skipping notification: missing user_id", { type, message });
    return null;
  }

  const userExists = await db("users").first("id").where({ id: user_id });
  if (!userExists) {
    logger.warn(
      `Skipping notification: user ${user_id} not found for type ${
        type || "unspecified"
      }`
    );
    return null;
  }

  const tenantColumnExists = await hasTenantColumn();
  const effectiveTenantId = await resolveTenantIdForUser(user_id, tenant_id);
  if (tenantColumnExists && !effectiveTenantId) {
    logger.warn("Skipping notification: tenant_id required for multitenancy", {
      user_id,
      type,
    });
    return null;
  }

  try {
    const [row] = await db("notifications")
      .insert({
        user_id,
        type,
        message,
        tenant_id: tenantColumnExists ? effectiveTenantId : undefined,
        created_at: new Date(),
      })
      .returning("*");
    return row;
  } catch (err) {
    if (err?.code === "23503") {
      logger.warn(
        `Skipping notification: foreign key violation for user ${user_id} and type ${
          type || "unspecified"
        }`
      );
      return null;
    }
    logger.error("Failed to create notification:", err);
    throw err;
  }
};

exports.getUserNotifications = async (userId, tenantId) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !tenantId) {
    logger.warn("Tenant context required to fetch notifications", { userId });
    return [];
  }

  const threshold = new Date(Date.now() - 60 * 60 * 1000);
  // Cleanup read notifications older than an hour for this user
  // If system-wide deletion is needed, consider moving cleanup to a scheduled job
  await db("notifications")
    .modify((query) => {
      query.where({ read: true, user_id: userId });
      if (tenantColumnExists) {
        query.andWhere("tenant_id", tenantId);
      }
    })
    .andWhere("read_at", "<", threshold)
    .del();
  return db("notifications")
    .where({ user_id: userId })
    .modify((query) => {
      if (tenantColumnExists) {
        query.andWhere("tenant_id", tenantId);
      }
    })
    .orderBy("created_at", "desc");
};

exports.markAsRead = async (id, userId, tenantId) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !tenantId) {
    logger.warn("Tenant context required to mark notification as read", {
      id,
      userId,
    });
    return null;
  }

  const [row] = await db("notifications")
    .where({ id, user_id: userId })
    .modify((query) => {
      if (tenantColumnExists) {
        query.andWhere("tenant_id", tenantId);
      }
    })
    .update({ read: true, read_at: new Date() })
    .returning("*");
  return row;
};

exports.deleteNotification = async (id, userId, tenantId) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !tenantId) {
    logger.warn("Tenant context required to delete notification", {
      id,
      userId,
    });
    return null;
  }

  const [row] = await db("notifications")
    .where({ id, user_id: userId })
    .modify((query) => {
      if (tenantColumnExists) {
        query.andWhere("tenant_id", tenantId);
      }
    })
    .del()
    .returning("*");
  return row;
};
