const { v4: uuidv4 } = require("uuid");
const db = require("../../config/database");
const AppError = require("../../utils/AppError");

const normalizeDomain = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim().toLowerCase();
  return trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
};

const validateDomain = (domain) => {
  const regex = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;
  return regex.test(domain);
};

async function listByTenant(tenantId) {
  return db("tenant_domains").where({ tenant_id: tenantId }).orderBy("created_at", "asc");
}

async function createDomain(tenantId, domainInput) {
  const domain = normalizeDomain(domainInput);
  if (!domain || !validateDomain(domain)) {
    throw new AppError("Invalid domain", 400);
  }

  const existing = await db("tenant_domains").where({ domain }).first();
  if (existing) {
    throw new AppError("Domain already in use", 409);
  }

  const payload = {
    id: uuidv4(),
    tenant_id: tenantId,
    domain,
    status: "pending",
    verification_token: uuidv4(),
  };

  const [row] = await db("tenant_domains").insert(payload).returning("*");
  return row || payload;
}

async function verifyDomain(id, token, tenantId) {
  const domain = await db("tenant_domains").where({ id, tenant_id: tenantId }).first();
  if (!domain) throw new AppError("Domain not found", 404);
  if (!token || domain.verification_token !== token) {
    throw new AppError("Invalid verification token", 400);
  }
  const [updated] = await db("tenant_domains")
    .where({ id, tenant_id: tenantId })
    .update({ status: "verified", verified_at: new Date() })
    .returning("*");
  return updated || { ...domain, status: "verified", verified_at: new Date() };
}

async function deleteDomain(id, tenantId) {
  const deleted = await db("tenant_domains").where({ id, tenant_id: tenantId }).del();
  if (!deleted) throw new AppError("Domain not found", 404);
  return true;
}

module.exports = {
  listByTenant,
  createDomain,
  verifyDomain,
  deleteDomain,
  normalizeDomain,
};
