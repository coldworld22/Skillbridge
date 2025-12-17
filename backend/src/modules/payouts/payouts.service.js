const db = require("../../config/database");
const logger = require("../../utils/logger.js");

let hasTenantColumnPromise;

const hasTenantColumn = async () => {
  if (!hasTenantColumnPromise) {
    hasTenantColumnPromise = db.schema.hasColumn("payouts", "tenant_id");
  }
  return hasTenantColumnPromise;
};

const applyTenantScope = (query, tenantId, alias = "p") => {
  if (!tenantId) return query;
  return query.andWhere(`${alias}.tenant_id`, tenantId);
};

exports.create = async (data) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !data?.tenant_id) {
    throw new Error("tenant_id is required when creating payouts");
  }
  const payload = { ...data };
  if (!tenantColumnExists) {
    delete payload.tenant_id;
  }

  const [row] = await db("payouts").insert(payload).returning("*");
  return row;
};

exports.getAll = async (tenantId = null) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !tenantId) {
    logger.warn("Tenant context required to list payouts");
    return [];
  }

  return db({ p: "payouts" })
    .leftJoin("users as u", "p.instructor_id", "u.id")
    .select(
      "p.*",
      "u.full_name as instructor_name",
      "u.email as instructor_email"
    )
    .modify((query) => {
      if (tenantColumnExists) {
        query.where("p.tenant_id", tenantId);
      }
    })
    .orderBy("p.requested_at", "desc");

  return applyTenantScope(query, tenantId);
};

exports.getByInstructor = async (instructor_id, tenantId = null) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !tenantId) {
    logger.warn("Tenant context required for instructor payout history", {
      instructor_id,
    });
    return [];
  }

  return db("payouts")
    .where({ instructor_id })
    .modify((query) => {
      if (tenantColumnExists) {
        query.andWhere("tenant_id", tenantId);
      }
    })
    .select("*")
    .orderBy("requested_at", "desc");

  return applyTenantScope(query, tenantId);
};

exports.getById = async (id, tenantId = null) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !tenantId) {
    logger.warn("Tenant context required to fetch payout", { id });
    return null;
  }
  return db("payouts")
    .where({ id })
    .modify((query) => {
      if (tenantColumnExists && tenantId) {
        query.andWhere("tenant_id", tenantId);
      }
    })
    .first();
};

exports.update = async (id, data, tenantId = null) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !tenantId) {
    logger.warn("Tenant context required to update payout", { id });
    return null;
  }
  const payload = { ...data };
  if (!tenantColumnExists) {
    delete payload.tenant_id;
  }
  const [row] = await db("payouts")
    .where({ id })
    .modify((query) => {
      if (tenantColumnExists && tenantId) {
        query.andWhere("tenant_id", tenantId);
      }
    })
    .update(payload)
    .returning("*");
  return row;
};

exports.delete = async (id, tenantId = null) => {
  const tenantColumnExists = await hasTenantColumn();
  if (tenantColumnExists && !tenantId) {
    logger.warn("Tenant context required to delete payout", { id });
    return 0;
  }
  return db("payouts")
    .where({ id })
    .modify((query) => {
      if (tenantColumnExists && tenantId) {
        query.andWhere("tenant_id", tenantId);
      }
    })
    .del();
};
