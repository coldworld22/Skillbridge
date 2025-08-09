const db = require("../../config/database");

exports.create = async (data, schedules = []) => {
  return db.transaction(async (trx) => {
    const [row] = await trx("payments").insert(data).returning("*");
    if (schedules.length) {
      const records = schedules.map((s) => ({ ...s, payment_id: row.id }));
      await trx("payment_schedules").insert(records);
    }
    return row;
  });
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

exports.getByUser = async (userId) => {
  return db({ p: 'payments' })
    .leftJoin('payment_methods_config as m', 'p.method_id', 'm.id')
    .leftJoin('online_classes as c', function () {
      this.on('p.item_id', '=', 'c.id').andOn('p.item_type', '=', db.raw('?', ['class']));
    })
    .select(
      'p.*',
      'm.name as method_name',
      'c.title as class_title'
    )
    .where('p.user_id', userId)
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
