const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("payments").insert(data).returning("*");
  return row;
};

exports.getAll = async () => {
  return db({ p: 'payments' })
    .leftJoin('users as u', 'p.user_id', 'u.id')
    .leftJoin('payment_methods_config as m', 'p.method_id', 'm.id')
    .select(
      'p.*',
      'u.full_name as user_name',
      'u.role as user_role',
      'm.name as method_name'
    )
    .orderBy('p.created_at', 'desc');
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
