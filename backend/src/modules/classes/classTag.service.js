const db = require("../../config/database");

exports.getAllTags = async () => {
  return db("class_tags").select("*").orderBy("created_at", "desc");
};

exports.findByName = async (name) => {
  return db("class_tags")
    .whereRaw("LOWER(name) = ?", [name.toLowerCase()])
    .first();
};

exports.createTag = async (data) => {
  const [row] = await db("class_tags").insert(data).returning("*");
  return row;
};
