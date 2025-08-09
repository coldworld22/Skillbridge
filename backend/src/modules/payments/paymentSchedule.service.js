const db = require("../../config/database");

exports.create = (data, trx = db) => {
  return trx("payment_schedules").insert(data);
};

exports.getDue = () => {
  return db("payment_schedules as s")
    .join("payments as p", "s.payment_id", "p.id")
    .where("s.status", "pending")
    .andWhere("s.due_date", "<=", db.fn.now())
    .select("s.*", "p.user_id");
};

exports.markPaid = async (id, trx = db) => {
  const [row] = await trx("payment_schedules")
    .where({ id })
    .update({ status: "paid", paid_at: new Date() })
    .returning("*");
  return row;
};
