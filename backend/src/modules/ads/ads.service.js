const db = require("../../config/database");

exports.createAd = async (data) => {
  const [row] = await db("ads").insert(data).returning("*");
  return row;
};

// Fetch ads with optional inclusion of inactive ones
exports.getAds = async (includeInactive = false) => {
  return db("ads")
    .modify((qb) => {
      if (!includeInactive) qb.where({ is_active: true });
    })
    .orderBy("created_at", "desc");
};

exports.getAdById = async (id) => {
  return db("ads").where({ id }).first();
};

exports.findByTitle = async (title) => {
  if (!title) return null;
  return db("ads")
    .whereRaw('LOWER(title) = ?', [title.toLowerCase()])
    .first();
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
