const db = require("../../config/database");
const logger = require("../../utils/logger.js");

let hasTenantColumnPromise;
let hasTenantMembershipTablePromise;

const hasTenantColumn = async () => {
  if (!hasTenantColumnPromise) {
    hasTenantColumnPromise = db.schema.hasColumn("instructor_wallets", "tenant_id");
  }
  return hasTenantColumnPromise;
};

const hasTenantMembershipTable = async () => {
  if (!hasTenantMembershipTablePromise) {
    hasTenantMembershipTablePromise = db.schema.hasTable("tenant_memberships");
  }
  return hasTenantMembershipTablePromise;
};

const resolveTenantIdForUser = async (userId, tenantId, trx = db) => {
  if (tenantId) return tenantId;
  if (!(await hasTenantMembershipTable())) return null;
  const membership = await trx("tenant_memberships")
    .where({ user_id: userId, status: "active" })
    .orderBy("created_at")
    .first();
  return membership?.tenant_id || null;
};

exports.getByInstructor = async (instructor_id, tenantId = null) => {
  const tenantColumnExists = await hasTenantColumn();
  const resolvedTenantId = tenantColumnExists
    ? await resolveTenantIdForUser(instructor_id, tenantId)
    : null;

  if (tenantColumnExists && !resolvedTenantId) {
    logger.warn("Tenant context required to fetch instructor wallet", {
      instructor_id,
    });
    return null;
  }

  return db("instructor_wallets")
    .where({ instructor_id })
    .modify((query) => {
      if (tenantColumnExists) {
        query.andWhere("tenant_id", resolvedTenantId);
      }
    })
    .first();
};

exports.increment = async (instructor_id, amount, trx, tenantId = null) => {
  const tenantColumnExists = await hasTenantColumn();
  const resolvedTenantId = tenantColumnExists
    ? await resolveTenantIdForUser(instructor_id, tenantId, trx || db)
    : null;

  if (tenantColumnExists && !resolvedTenantId) {
    logger.warn("Tenant context required to increment instructor wallet", {
      instructor_id,
    });
    return null;
  }

  const query = trx || db;
  const insertData = { instructor_id, balance: amount };
  if (tenantColumnExists) {
    insertData.tenant_id = resolvedTenantId;
  }

  const [row] = await query("instructor_wallets")
    .insert(insertData)
    .onConflict(["instructor_id", ...(tenantColumnExists ? ["tenant_id"] : [])])
    .merge({
      balance: query.raw("?? + ?", ["balance", amount]),
      updated_at: query.fn.now(),
    })
    .returning("*");
  return row;
};

exports.decrement = async (instructor_id, amount, tenantId = null) => {
  const tenantColumnExists = await hasTenantColumn();
  const resolvedTenantId = tenantColumnExists
    ? await resolveTenantIdForUser(instructor_id, tenantId)
    : null;

  if (tenantColumnExists && !resolvedTenantId) {
    throw new Error("Tenant context required for wallet debit");
  }

  return db.transaction(async (trx) => {
    const wallet = await trx("instructor_wallets")
      .where({ instructor_id })
      .modify((query) => {
        if (tenantColumnExists) {
          query.andWhere("tenant_id", resolvedTenantId);
        }
      })
      .forUpdate()
      .first();

    if (tenantColumnExists && wallet && wallet.tenant_id !== resolvedTenantId) {
      throw new Error("wallet_tenant_mismatch");
    }

    const effectiveWallet = wallet;

    const balance = effectiveWallet ? Number(effectiveWallet.balance) : 0;
    if (balance < Number(amount)) {
      throw new Error("Insufficient balance");
    }

    const [row] = await trx("instructor_wallets")
      .where({ instructor_id })
      .modify((query) => {
        if (tenantColumnExists) {
          query.andWhere("tenant_id", resolvedTenantId);
        }
      })
      .update({
        balance: trx.raw("?? - ?", ["balance", amount]),
        updated_at: trx.fn.now(),
      })
      .returning("*");

    return row;
  });
};
