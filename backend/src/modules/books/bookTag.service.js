const db = require("../../config/database");

exports.getAllTags = (trx = db) =>
  trx("tags").select("*").orderBy("created_at", "desc");

exports.findByName = (name, trx = db) =>
  trx("tags").whereRaw("LOWER(name) = ?", [name.toLowerCase()]).first();

exports.findByNames = (names, trx = db) =>
  trx("tags").whereIn(trx.raw("LOWER(name)"), names.map((n) => n.toLowerCase()));

exports.createTag = async (data, trx = db) => {
  const [row] = await trx("tags").insert(data).returning("*");
  return row;
};

exports.createTags = async (rows, trx = db) => {
  if (!rows.length) return [];
  return await trx("tags").insert(rows).returning("*");
};

exports.searchTags = (search, limit = 10, trx = db) =>
  trx("tags")
    .modify((q) => {
      if (search) q.whereILike("name", `%${search}%`);
    })
    .orderBy("name")
    .limit(limit);
