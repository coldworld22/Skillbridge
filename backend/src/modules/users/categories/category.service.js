/**
 * Admin Category Management service
 * See docs/admin-category-management.md
 */
const db = require("../../../config/database");
const { parsePagination } = require("../../../utils/pagination");

exports.create = async (data) => db("categories").insert(data).returning("*").then(rows => rows[0]);

exports.findById = async (id) => db("categories").where({ id }).first();

// Find category by slug
exports.findBySlug = async (slug) => db("categories").where({ slug }).first();

exports.exists = async ({ name, parent_id, excludeId = null }) => {
  const query = db("categories").whereILike("name", name.trim());

  if (parent_id) {
    query.andWhere("parent_id", parent_id);
  } else {
    query.whereNull("parent_id");
  }

  if (excludeId) {
    query.andWhereNot("id", excludeId);
  }

  return query.first();
};

exports.update = async (id, data) => {
  return db("categories").where({ id }).update(data).returning("*").then(rows => rows[0]);
};

exports.delete = async (id) => db("categories").where({ id }).del();

// Count subcategories under a parent
exports.countChildren = async (parent_id) => {
  const result = await db("categories")
    .where({ parent_id })
    .count("id as count")
    .first();
  return parseInt(result.count);
};

// Update only the status column
exports.updateStatus = async (id, status) =>
  db("categories").where({ id }).update({ status });

exports.getAll = async ({ search, status, page = 1, limit = 10 }) => {
  const { page: pg, limit: lim, offset } = parsePagination({ page, limit });

  const baseQuery = db("categories as c").modify((query) => {
    if (search) query.whereILike("c.name", `%${search}%`);
    if (status !== "all") query.andWhere("c.status", status);
  });

  const totalQuery = baseQuery.clone().count("* as count").first();

  const classesCountSubquery = db("online_classes as oc")
    .select("oc.category_id")
    .count("oc.id as total_classes")
    .groupBy("oc.category_id");

  const dataQuery = baseQuery
    .clone()
    .leftJoin(classesCountSubquery.as("cc"), "c.id", "cc.category_id")
    .select("c.*", db.raw("COALESCE(cc.total_classes, 0) as classes_count"))
    .limit(lim)
    .offset(offset)
    .orderBy("c.created_at", "desc");

  const [totalResult, data] = await Promise.all([totalQuery, dataQuery]);

  return {
    total: parseInt(totalResult.count),
    data,
    page: pg,
    limit: lim,
  };
};

exports.getNested = async () => {
  const categories = await db("categories")
    .where({ status: "active" })
    .select("id", "name", "parent_id", "slug", "icon", "image_url", "status")
    .orderBy("created_at", "asc");

  const buildTree = (parentId = null) =>
    categories
      .filter((cat) => cat.parent_id === parentId)
      .map((cat) => ({
        ...cat,
        children: buildTree(cat.id),
      }));

  return buildTree(null);
};
