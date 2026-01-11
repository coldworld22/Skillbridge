const db = require("../../config/database");

let tenantColumnPromise;

const hasTenantColumn = async () => {
  if (!tenantColumnPromise) {
    tenantColumnPromise = db.schema.hasColumn("invoices", "tenant_id");
  }
  return tenantColumnPromise;
};

const applyTenantScope = async (query, tenantId) => {
  if (tenantId && (await hasTenantColumn())) {
    query.andWhere({ tenant_id: tenantId });
  }
  return query;
};

exports.create = async (data, tenantId = null) => {
  const payload = { ...data };
  const hasTenant = await hasTenantColumn();
  if (tenantId && hasTenant) {
    payload.tenant_id = tenantId;
  } else if (!hasTenant && payload.tenant_id !== undefined) {
    delete payload.tenant_id;
  }
  const [row] = await db("invoices").insert(payload).returning("*");
  return row;
};

exports.getAll = async (tenantId = null) => {
  const query = db("invoices").orderBy("created_at", "desc");
  await applyTenantScope(query, tenantId);
  return query;
};

exports.getById = async (id, tenantId = null) => {
  const query = db("invoices").where({ id });
  await applyTenantScope(query, tenantId);
  return query.first();
};

exports.getByUser = async (user_id, tenantId = null) => {
  const query = db("invoices")
    .where({ user_id })
    .orderBy("created_at", "desc");
  await applyTenantScope(query, tenantId);
  return query;
};

exports.findByPayment = async (payment_id, tenantId = null) => {
  const query = db("invoices").where({ payment_id });
  await applyTenantScope(query, tenantId);
  return query.first();
};

exports.update = async (id, data, tenantId = null) => {
  const query = db("invoices").where({ id });
  await applyTenantScope(query, tenantId);
  const [row] = await query.update(data).returning("*");
  return row;
};
