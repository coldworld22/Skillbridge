const db = require("../../../config/database");

exports.getAllTags = async () => {
  return db("tags").select("*").orderBy("created_at", "desc");
};

exports.findByName = async (name, trx = db) => {
  return trx("tags")
    .whereRaw("LOWER(name) = ?", [name.toLowerCase()])
    .first();
};

exports.createTag = async (data, trx = db) => {
  const [row] = await trx("tags").insert(data).returning("*");
  return row;
};

exports.searchTags = async (search, limit = 10) => {
  return db("tags")
    .modify(query => {
      if (search) query.whereILike("name", `%${search}%`);
    })
    .orderBy("name")
    .limit(limit);
};
