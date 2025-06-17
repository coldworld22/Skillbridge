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
