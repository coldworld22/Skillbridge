const db = require("../../../config/database");

exports.getAllTags = async () => {
  return db("community_tags").select("*").orderBy("created_at", "desc");
};

exports.createTag = async (data) => {
  const [row] = await db("community_tags").insert(data).returning("*");
  return row;
};

exports.updateTag = async (id, data) => {
  const [row] = await db("community_tags").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteTag = async (id) => {
  return db("community_tags").where({ id }).del();
};
