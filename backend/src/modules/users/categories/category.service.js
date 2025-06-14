const db = require("../../../config/database");

exports.create = async (data) => db("categories").insert(data).returning("*").then(rows => rows[0]);

exports.findById = async (id) => db("categories").where({ id }).first();

// Find category by slug
exports.findBySlug = async (slug) => db("categories").where({ slug }).first();

exports.exists = async ({ name, parent_id }) => {
  return db("categories")
    .where({ name })
    .andWhere({ parent_id: parent_id || null })
    .first();
};

exports.update = async (id, data) => {
  return db("categories").where({ id }).update(data).returning("*").then(rows => rows[0]);
};

exports.delete = async (id) => db("categories").where({ id }).del();

exports.getAll = async ({ search, status, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  const baseQuery = db("categories").modify((query) => {
    if (search) query.whereILike("name", `%${search}%`);
    if (status !== "all") query.andWhere("status", status);
  });

  const totalQuery = baseQuery.clone().count("* as count").first();
  const dataQuery = baseQuery.clone().limit(limit).offset(offset).orderBy("created_at", "desc");

  const [totalResult, data] = await Promise.all([totalQuery, dataQuery]);

  return {
    total: parseInt(totalResult.count),
    data,
    page: Number(page),
    limit: Number(limit),
  };
};

exports.getNested = async () => {
  const categories = await db("categories")
    .where({ status: "active" })
    .select("id", "name", "parent_id", "slug")
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
