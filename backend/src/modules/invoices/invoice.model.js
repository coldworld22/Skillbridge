const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("invoices").insert(data).returning("*");
  return row;
};

exports.getAll = () => {
  return db("invoices").orderBy("created_at", "desc");
};

exports.getById = (id) => {
  return db("invoices").where({ id }).first();
};

exports.getByUser = (user_id) => {
  return db("invoices").where({ user_id }).orderBy("created_at", "desc");
};

exports.findByPayment = (payment_id) => {
  return db("invoices").where({ payment_id }).first();
};

exports.update = async (id, data) => {
  const [row] = await db("invoices").where({ id }).update(data).returning("*");
  return row;
};
