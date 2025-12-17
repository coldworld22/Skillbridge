const db = require("../../config/database");

const ensureTenant = (tenantId) => {
  if (!tenantId) throw new Error("tenant_required");
  return tenantId;
};

exports.searchClasses = async (q, tenantId) => {
  const term = `%${q}%`;
  const tenant = ensureTenant(tenantId);
  return db("online_classes")
    .where({ tenant_id: tenant })
    .andWhere(function () {
      this.whereRaw("title ILIKE ?", [term]).orWhereRaw("description ILIKE ?", [
        term,
      ]);
    })
    .select("id", "title", "cover_image as cover", "slug")
    .limit(5);
};

exports.searchTutorials = async (q, tenantId) => {
  const term = `%${q}%`;
  const tenant = ensureTenant(tenantId);
  return db("tutorials")
    .where({ tenant_id: tenant })
    .andWhere(function () {
      this.whereRaw("title ILIKE ?", [term]).orWhereRaw("description ILIKE ?", [
        term,
      ]);
    })
    .select("id", "title", "cover_image as cover", "slug")
    .limit(5);
};

exports.searchBooks = async (q, tenantId) => {
  const term = `%${q}%`;
  const tenant = ensureTenant(tenantId);
  return db("books")
    .where({ tenant_id: tenant, status: "approved" })
    .andWhere(function () {
      this.whereRaw("title ILIKE ?", [term])
        .orWhereRaw("short_description ILIKE ?", [term])
        .orWhereRaw("detailed_description ILIKE ?", [term]);
    })
    .modify((query) => applyTenantScope(query, tenantId))
    .select("id", "title", "cover_image_url as cover")
    .limit(5);
};

exports.searchInstructors = async (q, tenantId) => {
  const term = `%${q}%`;
  const tenant = ensureTenant(tenantId);
  return db("users as u")
    .join("tenant_memberships as tm", "tm.user_id", "u.id")
    .where("tm.tenant_id", tenant)
    .andWhere("tm.status", "active")
    .andWhere("tm.role", "instructor")
    .andWhereRaw("u.full_name ILIKE ?", [term])
    .select("u.id", "u.full_name", "u.avatar_url")
    .limit(5);
};

exports.searchOffers = async (q, tenantId) => {
  const term = `%${q}%`;
  const tenant = ensureTenant(tenantId);
  return db("offers")
    .where({ tenant_id: tenant, status: "open" })
    .andWhere(function () {
      this.whereRaw("title ILIKE ?", [term]).orWhereRaw("description ILIKE ?", [
        term,
      ]);
    })
    .modify((query) => applyTenantScope(query, tenantId))
    .select("id", "title")
    .limit(5);
};

exports.searchCommunity = async (q, tenantId) => {
  const term = `%${q}%`;
  const tenant = ensureTenant(tenantId);
  return db("community_discussions")
    .where({ tenant_id: tenant })
    .andWhere(function () {
      this.whereRaw("title ILIKE ?", [term]).orWhereRaw("content ILIKE ?", [
        term,
      ]);
    })
    .select("id", "title")
    .limit(5);
};

exports.searchBlog = async (q, tenantId) => {
  const term = `%${q}%`;
  const tenant = ensureTenant(tenantId);
  return db("blog_posts")
    .where({ tenant_id: tenant })
    .andWhere(function () {
      this.whereRaw("title ILIKE ?", [term]).orWhereRaw("excerpt ILIKE ?", [
        term,
      ]);
    })
    .select("id", "title", "slug", "image_url as image")
    .limit(5);
};
