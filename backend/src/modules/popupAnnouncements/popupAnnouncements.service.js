const db = require("../../config/database");

exports.getAll = async () => {
  const rows = await db("popup_announcements")
    .select("*")
    .orderBy("created_at", "desc");
  return rows.map((r) => ({
    ...r,
    pages: Array.isArray(r.pages) ? r.pages : JSON.parse(r.pages || "[]"),
  }));
};

exports.create = async (data) => {
  const [row] = await db("popup_announcements")
    .insert(data)
    .returning("*");
  return {
    ...row,
    pages: Array.isArray(row.pages) ? row.pages : JSON.parse(row.pages || "[]"),
  };
};

exports.update = async (id, data) => {
  const [row] = await db("popup_announcements")
    .where({ id })
    .update(data)
    .returning("*");
  return {
    ...row,
    pages: Array.isArray(row.pages) ? row.pages : JSON.parse(row.pages || "[]"),
  };
};

exports.remove = async (id) => {
  return db("popup_announcements").where({ id }).del();
};
