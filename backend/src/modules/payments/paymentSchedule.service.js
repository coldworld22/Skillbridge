const db = require("../../config/database");

exports.create = (data, trx = db) => {
  return trx("payment_schedules").insert(data);
};

exports.getDue = () => {
  return db("payment_schedules as s")
    .join("payments as p", "s.payment_id", "p.id")
    .where("s.status", "pending")
    .andWhere("s.due_date", "<=", db.fn.now())
    .leftJoin("online_classes as c", function () {
      this.on("p.item_id", "=", db.raw("c.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["class"])
      );
    })
    .leftJoin("users as u", "p.user_id", "u.id")
    .select(
      "s.*",
      "p.user_id",
      "p.item_type",
      "p.item_id",
      "c.title as class_title",
      "c.instructor_id",
      "u.full_name as student_name"
    );
};

exports.markPaid = async (id, trx = db) => {
  const [row] = await trx("payment_schedules")
    .where({ id })
    .update({ status: "paid", paid_at: new Date() })
    .returning("*");
  return row;
};

exports.markAwaitingPayment = async (id, trx = db) => {
  const [row] = await trx("payment_schedules")
    .where({ id })
    .update({ status: "awaiting_payment", updated_at: new Date() })
    .returning("*");
  return row;
};
