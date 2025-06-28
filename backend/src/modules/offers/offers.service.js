const db = require("../../config/database");

exports.createOffer = async (data) => {
  const [row] = await db("offers").insert(data).returning("*");
  return row;
};

exports.getOffers = () => {
  return db("offers").orderBy("created_at", "desc");
};

exports.getOfferById = (id) => {
  return db("offers").where({ id }).first();
};

exports.updateOffer = async (id, data) => {
  const [row] = await db("offers").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteOffer = (id) => {
  return db("offers").where({ id }).del();
};
