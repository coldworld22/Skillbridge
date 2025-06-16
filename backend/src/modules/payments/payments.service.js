const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("payments").insert(data).returning("*");
  return row;
};

exports.getAll = async () => {
  return db("payments").select("*").orderBy("created_at", "desc");
};

exports.getById = async (id) => {
  return db("payments").where({ id }).first();
};

exports.update = async (id, data) => {
  const [row] = await db("payments").where({ id }).update(data).returning("*");
  return row;
};

exports.delete = async (id) => {
  return db("payments").where({ id }).del();
};
