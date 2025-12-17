const db = require("../../config/database");

const applyTenantScope = (query, tenantId, alias = "p") => {
  if (!tenantId) return query;
  return query.andWhere(`${alias}.tenant_id`, tenantId);
};

exports.create = async (data) => {
  if (!data.tenant_id) {
    throw new Error("tenant_id is required for payout creation");
  }
  const [row] = await db("payouts").insert(data).returning("*");
  return row;
};

exports.getAll = async (tenantId) => {
  const query = db({ p: "payouts" })
    .leftJoin("users as u", "p.instructor_id", "u.id")
    .select(
      "p.*",
      "u.full_name as instructor_name",
      "u.email as instructor_email"
    )
    .orderBy("p.requested_at", "desc");

  return applyTenantScope(query, tenantId);
};

exports.getByInstructor = async (instructor_id, tenantId) => {
  const query = db("payouts")
    .where({ instructor_id })
    .select("*")
    .orderBy("requested_at", "desc");

  return applyTenantScope(query, tenantId);
};

exports.getById = async (id, tenantId) => {
  const query = db("payouts").where({ id });
  return applyTenantScope(query, tenantId, "payouts").first();
};

exports.update = async (id, data, tenantId) => {
  const query = db("payouts").where({ id });
  const scoped = applyTenantScope(query, tenantId, "payouts");
  const [row] = await scoped.update(data).returning("*");
  return row;
};

exports.delete = async (id, tenantId) => {
  const query = db("payouts").where({ id });
  return applyTenantScope(query, tenantId, "payouts").del();
};
