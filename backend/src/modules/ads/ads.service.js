const db = require("../../config/database");

exports.createAd = async (data) => {
  const [row] = await db("ads").insert(data).returning("*");
  return row;
};

exports.getAds = async () => {
  return db("ads").orderBy("created_at", "desc");
};

exports.getAdById = async (id) => {
  return db("ads").where({ id }).first();
};

exports.findByTitle = async (title) => {
  return db("ads").where({ title }).first();
};

exports.updateAd = async (id, data) => {
  const [row] = await db("ads").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteAd = (id) => {
  return db("ads").where({ id }).del();
};

exports.getAdAnalytics = async (adId) => {
  return db("ad_analytics").where({ ad_id: adId }).first();
};
