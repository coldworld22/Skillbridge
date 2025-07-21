const db = require("../../config/database");

exports.getAll = async () => {
  return db("popup_announcements").select("*").orderBy("created_at", "desc");
};

exports.create = async (data) => {
  const [row] = await db("popup_announcements").insert(data).returning("*");
  return row;
};

exports.update = async (id, data) => {
  const [row] = await db("popup_announcements").where({ id }).update(data).returning("*");
  return row;
};

exports.remove = async (id) => {
  return db("popup_announcements").where({ id }).del();
};
