const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("payouts").insert(data).returning("*");
  return row;
};

exports.getAll = async () => {
  return db("payouts").select("*").orderBy("requested_at", "desc");
};

exports.getById = async (id) => {
  return db("payouts").where({ id }).first();
};

exports.update = async (id, data) => {
  const [row] = await db("payouts").where({ id }).update(data).returning("*");
  return row;
};

exports.delete = async (id) => {
  return db("payouts").where({ id }).del();
};
