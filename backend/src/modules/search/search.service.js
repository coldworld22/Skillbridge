const db = require("../../config/database");

const applyTenantScope = (query, tenantId, table = "") => {
  if (!tenantId) {
    query.whereRaw("1 = 0");
    return;
  }
  const column = table ? `${table}.tenant_id` : "tenant_id";
  query.andWhere(column, tenantId);
};

exports.searchClasses = async (q, tenantId) => {
  const term = `%${q}%`;
  return db("online_classes")
    .where(function () {
      this.whereRaw("title ILIKE ?", [term]).orWhereRaw(
        "description ILIKE ?",
        [term],
      );
    })
    .modify((query) => applyTenantScope(query, tenantId))
    .select("id", "title", "cover_image as cover", "slug")
    .limit(5);
};

exports.searchTutorials = async (q, tenantId) => {
  const term = `%${q}%`;
  return db("tutorials")
    .where(function () {
      this.whereRaw("title ILIKE ?", [term]).orWhereRaw(
        "description ILIKE ?",
        [term],
      );
    })
    .modify((query) => applyTenantScope(query, tenantId))
    .select("id", "title", "cover_image as cover", "slug")
    .limit(5);
};

exports.searchBooks = async (q, tenantId) => {
  const term = `%${q}%`;
  return db("books")
    .where({ status: "approved" })
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
  return db({ tm: "tenant_memberships" })
    .join({ u: "users" }, "tm.user_id", "u.id")
    .whereRaw("u.full_name ILIKE ?", [term])
    .andWhereRaw("LOWER(u.role) = ?", ["instructor"])
    .modify((query) => applyTenantScope(query, tenantId, "tm"))
    .select("u.id", "u.full_name", "u.avatar_url")
    .distinct()
    .limit(5);
};

exports.searchOffers = async (q, tenantId) => {
  const term = `%${q}%`;
  return db("offers")
    .where("status", "open")
    .andWhere(function () {
      this.whereRaw("title ILIKE ?", [term]).orWhereRaw("description ILIKE ?", [term]);
    })
    .modify((query) => applyTenantScope(query, tenantId))
    .select("id", "title")
    .limit(5);
};

exports.searchCommunity = async (q, tenantId) => {
  const term = `%${q}%`;
  return db("community_discussions")
    .whereRaw("title ILIKE ?", [term])
    .orWhereRaw("content ILIKE ?", [term])
    .modify((query) => applyTenantScope(query, tenantId))
    .select("id", "title")
    .limit(5);
};

exports.searchBlog = async (q, tenantId) => {
  const term = `%${q}%`;
  return db("blog_posts")
    .whereRaw("title ILIKE ?", [term])
    .orWhereRaw("excerpt ILIKE ?", [term])
    .modify((query) => applyTenantScope(query, tenantId))
    .select("id", "title", "slug", "image_url as image")
    .limit(5);
};
