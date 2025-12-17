const db = require("../../config/database");

const applyTenantScope = (query, tenantId) => {
  if (!tenantId) return query;
  return query.andWhere({ tenant_id: tenantId });
};

exports.create = async (data) => {
  const [row] = await db("invoices").insert(data).returning("*");
  return row;
};

exports.getAll = (tenantId) => {
  const query = db("invoices").orderBy("created_at", "desc");
  return applyTenantScope(query, tenantId);
};

exports.getById = (id, tenantId) => {
  const query = db("invoices").where({ id });
  return applyTenantScope(query, tenantId).first();
};

exports.getByUser = (user_id, tenantId) => {
  const query = db("invoices")
    .where({ user_id })
    .orderBy("created_at", "desc");
  return applyTenantScope(query, tenantId);
};

exports.findByPayment = (payment_id, tenantId) => {
  const query = db("invoices").where({ payment_id });
  return applyTenantScope(query, tenantId).first();
};

exports.update = async (id, data, tenantId) => {
  const query = db("invoices").where({ id });
  const scoped = applyTenantScope(query, tenantId);
  const [row] = await scoped.update(data).returning("*");
  return row;
};
