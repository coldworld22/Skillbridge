const db = require("../../../config/database");

exports.getAllAnnouncements = async () => {
  return db("popup_announcements").select("*").orderBy("created_at", "desc");
};

exports.createAnnouncement = async (data) => {
  const [row] = await db("popup_announcements").insert(data).returning("*");
  return row;
};

exports.updateAnnouncement = async (id, data) => {
  const [row] = await db("popup_announcements").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteAnnouncement = async (id) => {
  return db("popup_announcements").where({ id }).del();
};
