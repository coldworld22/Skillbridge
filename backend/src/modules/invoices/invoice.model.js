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

exports.getAll = () => {
  return db("invoices").orderBy("created_at", "desc");
};

exports.getById = (id) => {
  return db("invoices").where({ id }).first();
};

exports.getByUser = (user_id) => {
  return db("invoices").where({ user_id }).orderBy("created_at", "desc");
};

exports.findByPayment = (payment_id) => {
  return db("invoices").where({ payment_id }).first();
};

exports.update = async (id, data) => {
  const [row] = await db("invoices").where({ id }).update(data).returning("*");
  return row;
};
