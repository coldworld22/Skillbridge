const db = require("../../config/database");
const AppError = require("../../utils/AppError");

const STATUS = {
  PENDING_PAYMENT: "pending_payment",
  AWAITING_APPROVAL: "awaiting_approval",
  PAID: "paid",
  REJECTED: "rejected",
};

exports.STATUS = STATUS;

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

exports.getAll = async (status, methodType) => {
  const query = db({ p: "payments" })
    .leftJoin("users as u", "p.user_id", "u.id")
    .leftJoin("payment_methods_config as m", "p.method_id", "m.id")
    .select(
      "p.*",
      "u.full_name as user_name",
      "u.role as user_role",
      "m.name as method_name"
    )
    .orderBy("p.created_at", "desc");

  if (status) {
    query.where("p.status", status);
  }

  if (methodType) {
    query.andWhere("m.type", methodType);
  }

  return query;
};

exports.getByUser = async (userId, status) => {
  const query = db({ p: "payments" })
    .leftJoin("payment_methods_config as m", "p.method_id", "m.id")
    .leftJoin("online_classes as c", function () {
      this.on("p.item_id", "=", "c.id").andOn(
        "p.item_type",
        "=",
        db.raw("?", ["class"])
      );
    })
    .select("p.*", "m.name as method_name", "c.title as class_title")
    .where("p.user_id", userId)
    .orderBy("p.created_at", "desc");

  if (status) {
    query.andWhere("p.status", status);
  }

  return query;
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

exports.approveBankPayment = async (
  id,
  { amount, item_id, item_type } = {}
) => {
  return db.transaction(async (trx) => {
    const payment = await trx("payments").where({ id }).first();
    if (!payment) throw new AppError("Payment not found", 404);

    if (payment.status !== STATUS.AWAITING_APPROVAL) {
      throw new AppError("Payment is not awaiting approval", 400);
    }

    if (amount !== undefined && Number(payment.amount) !== Number(amount)) {
      throw new AppError("Payment amount does not match", 400);
    }

    if (item_id !== undefined && payment.item_id !== item_id) {
      throw new AppError("Payment item does not match order", 400);
    }

    if (item_type !== undefined && payment.item_type !== item_type) {
      throw new AppError("Payment item type does not match order", 400);
    }

    const [row] = await trx("payments")
      .where({ id })
      .update({ status: STATUS.PAID, paid_at: new Date() })
      .returning("*");

    return row;
  });
};

exports.rejectBankPayment = async (
  id,
  { amount, item_id, item_type } = {}
) => {
  return db.transaction(async (trx) => {
    const payment = await trx("payments").where({ id }).first();
    if (!payment) throw new AppError("Payment not found", 404);

    if (payment.status !== STATUS.AWAITING_APPROVAL) {
      throw new AppError("Payment is not awaiting approval", 400);
    }

    if (amount !== undefined && Number(payment.amount) !== Number(amount)) {
      throw new AppError("Payment amount does not match", 400);
    }

    if (item_id !== undefined && payment.item_id !== item_id) {
      throw new AppError("Payment item does not match order", 400);
    }

    if (item_type !== undefined && payment.item_type !== item_type) {
      throw new AppError("Payment item type does not match order", 400);
    }

    const [row] = await trx("payments")
      .where({ id })
      .update({ status: STATUS.REJECTED })
      .returning("*");

    return row;
  });
};
