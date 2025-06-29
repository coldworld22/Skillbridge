const db = require("../../config/database");

exports.getAllTags = async () => {
  return db("offer_tags").select("*").orderBy("created_at", "desc");
};

exports.findByName = async (name) => {
  return db("offer_tags")
    .whereRaw("LOWER(name) = ?", [name.toLowerCase()])
    .first();
};

exports.createTag = async (data) => {
  const [row] = await db("offer_tags").insert(data).returning("*");
  return row;
};

exports.searchTags = async (search, limit = 10) => {
  return db("offer_tags")
    .modify(query => {
      if (search) query.whereILike("name", `%${search}%`);
    })
    .orderBy("name")
    .limit(limit);
};
