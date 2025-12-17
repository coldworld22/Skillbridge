const db = require("../../config/database");

const resolveTenantId = async (instructor_id, query, preferredTenantId) => {
  if (preferredTenantId) return preferredTenantId;

  const existingWallet = await query("instructor_wallets")
    .where({ instructor_id })
    .first("tenant_id");
  if (existingWallet?.tenant_id) return existingWallet.tenant_id;

  const profile = await query("instructor_profiles")
    .where({ user_id: instructor_id })
    .first("tenant_id");
  if (profile?.tenant_id) return profile.tenant_id;

  const membership = await query("tenant_memberships")
    .where({ user_id: instructor_id, status: "active" })
    .first("tenant_id");

  return membership?.tenant_id || null;
};

exports.getByInstructor = async (instructor_id, { tenantId } = {}) => {
  const baseQuery = db("instructor_wallets").where({ instructor_id });
  if (tenantId) {
    baseQuery.andWhere({ tenant_id: tenantId });
  }
  const wallet = await baseQuery.first();
  if (wallet || tenantId) return wallet;

  const resolvedTenantId = await resolveTenantId(instructor_id, db);
  if (!resolvedTenantId) return wallet;

  return db("instructor_wallets")
    .where({ instructor_id, tenant_id: resolvedTenantId })
    .first();
};

exports.increment = async (instructor_id, amount, trx, options = {}) => {
  const query = trx || db;
  const tenantId = await resolveTenantId(
    instructor_id,
    query,
    options.tenantId,
  );

  if (!tenantId) {
    throw new Error("tenant_id_required_for_wallet");
  }

  const [row] = await query("instructor_wallets")
    .insert({ instructor_id, tenant_id: tenantId, balance: amount })
    .onConflict("instructor_id")
    .merge({
      balance: query.raw("?? + ?", ["balance", amount]),
      tenant_id: tenantId,
      updated_at: query.fn.now(),
    })
    .returning("*");
  return row;
};

exports.decrement = async (instructor_id, amount, options = {}) => {
  return db.transaction(async (trx) => {
    const wallet = await trx("instructor_wallets")
      .where({ instructor_id })
      .modify((qb) => {
        if (options.tenantId) qb.andWhere({ tenant_id: options.tenantId });
      })
      .forUpdate()
      .first();

    const tenantId = await resolveTenantId(
      instructor_id,
      trx,
      options.tenantId || wallet?.tenant_id,
    );

    if (!tenantId) {
      throw new Error("tenant_id_required_for_wallet");
    }

    if (wallet && wallet.tenant_id && wallet.tenant_id !== tenantId) {
      throw new Error("wallet_tenant_mismatch");
    }

    let effectiveWallet = wallet;
    if (wallet && wallet.tenant_id && wallet.tenant_id !== tenantId) {
      effectiveWallet = await trx("instructor_wallets")
        .where({ instructor_id, tenant_id: tenantId })
        .forUpdate()
        .first();
    }

    const balance = effectiveWallet ? Number(effectiveWallet.balance) : 0;
    if (balance < Number(amount)) {
      throw new Error("Insufficient balance");
    }

    const [row] = await trx("instructor_wallets")
      .where({ instructor_id })
      .andWhere({ tenant_id: tenantId })
      .update({
        balance: trx.raw("?? - ?", ["balance", amount]),
        tenant_id: tenantId,
        updated_at: trx.fn.now(),
      })
      .returning("*");

    return row;
  });
};
