const db = require("../../config/database");

exports.getAllTags = () => db("tags").select("*").orderBy("created_at", "desc");

exports.findByName = (name) =>
  db("tags").whereRaw("LOWER(name) = ?", [name.toLowerCase()]).first();

exports.createTag = async (data) => {
  const [row] = await db("tags").insert(data).returning("*");
  return row;
};

exports.searchTags = (search, limit = 10) =>
  db("tags")
    .modify((q) => {
      if (search) q.whereILike("name", `%${search}%`);
    })
    .orderBy("name")
    .limit(limit);
