const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("payment_methods_config").insert(data).returning("*");
  return row;
};

exports.getAll = () => {
  return db("payment_methods_config").select("*").orderBy("id");
};

exports.getById = (id) => {
  return db("payment_methods_config").where({ id }).first();
};

exports.update = async (id, data) => {
  const [row] = await db("payment_methods_config")
    .where({ id })
    .update(data)
    .returning("*");
  return row;
};

exports.delete = (id) => {
  return db("payment_methods_config").where({ id }).del();
};
