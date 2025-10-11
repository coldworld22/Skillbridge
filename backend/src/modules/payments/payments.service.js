const db = require("../../config/database");
const AppError = require("../../utils/AppError");

const STATUS = {
  PENDING_PAYMENT: "pending_payment",
  AWAITING_APPROVAL: "awaiting_approval",
  PAID: "paid",
  REJECTED: "rejected",
};

exports.STATUS = STATUS;

let paymentColumnInfoPromise;
const getPaymentColumnInfo = async () => {
  if (!paymentColumnInfoPromise) {
    paymentColumnInfoPromise = Promise.all([
      db.schema.hasColumn("payments", "platform_fee"),
      db.schema.hasColumn("payments", "instructor_amount"),
      db.schema.hasColumn("payments", "source"),
    ]).then(([hasPlatformFee, hasInstructorAmount, hasSource]) => ({
      hasPlatformFee,
      hasInstructorAmount,
      hasSource,
    }));
  }
  return paymentColumnInfoPromise;
};

exports.create = async (data, schedules = [], trx) => {
  const run = async (transaction) => {
    const [row] = await transaction("payments").insert(data).returning("*");
    if (schedules.length) {
      const records = schedules.map((s) => ({ ...s, payment_id: row.id }));
      await transaction("payment_schedules").insert(records);
    }
    return row;
  };

  if (trx) {
    return run(trx);
  }

  return db.transaction(run);
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
    const payment = await trx("payments").where({ id }).forUpdate().first();
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
    const payment = await trx("payments").where({ id }).forUpdate().first();
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

exports.getByInstructor = async (
  instructorId,
  { status, itemType } = {}
) => {
  const { hasPlatformFee, hasInstructorAmount, hasSource } =
    await getPaymentColumnInfo();

  const query = db({ p: "payments" })
    .leftJoin("payment_methods_config as m", "p.method_id", "m.id")
    .leftJoin("online_classes as c", function () {
      this.on("p.item_id", "=", "c.id").andOn(
        "p.item_type",
        "=",
        db.raw("?", ["class"])
      );
    })
    .leftJoin("tutorials as tut", function () {
      this.on("p.item_id", "=", "tut.id").andOn(
        "p.item_type",
        "=",
        db.raw("?", ["tutorial"])
      );
    })
    // Cast IDs to text so UUID payment references can match integer book IDs
    .leftJoin("books as b", function () {
      this.on(db.raw("p.item_type"), db.raw("?", ["book"]));
      this.on(db.raw("p.item_id::text"), "=", db.raw("b.id::text"));
    })
    .leftJoin("users as u", "p.user_id", "u.id")
    .select(
      "p.id",
      "p.item_type",
      "p.item_id",
      "p.status",
      "p.amount",
      "p.currency",
      "p.reference_id",
      "p.method_id",
      "p.paid_at",
      "p.created_at",
      "m.name as method_name",
      "u.full_name as student_name",
      db.raw("COALESCE(c.title, tut.title, b.title) as item_title"),
      db.raw("COALESCE(c.price, tut.price, b.price) as item_price")
    )
    .where(function () {
      this.where("c.instructor_id", instructorId)
        .orWhere("tut.instructor_id", instructorId)
        .orWhere("b.instructor_id", instructorId);
    })
    .orderBy("p.created_at", "desc");

  if (status) {
    query.andWhere("p.status", status);
  }

  if (itemType) {
    query.andWhere("p.item_type", itemType);
  }

  if (hasPlatformFee) {
    query.select("p.platform_fee");
  } else {
    query.select(db.raw("NULL as platform_fee"));
  }

  if (hasInstructorAmount) {
    query.select("p.instructor_amount");
  } else {
    query.select(db.raw("NULL as instructor_amount"));
  }

  if (hasSource) {
    query.select("p.source");
  } else {
    query.select(db.raw("NULL as source"));
  }

  return query;
};

exports.getInstructorTotals = async (instructorId) => {
  const { hasPlatformFee, hasInstructorAmount } = await getPaymentColumnInfo();
  const instructorColumn = hasInstructorAmount
    ? "p.instructor_amount"
    : "p.amount";
  const [row] = await db({ p: "payments" })
    .leftJoin("online_classes as c", function () {
      this.on("p.item_id", "=", "c.id").andOn(
        "p.item_type",
        "=",
        db.raw("?", ["class"])
      );
    })
    .leftJoin("tutorials as tut", function () {
      this.on("p.item_id", "=", "tut.id").andOn(
        "p.item_type",
        "=",
        db.raw("?", ["tutorial"])
      );
    })
    // Cast IDs to text so UUID payment references can match integer book IDs
    .leftJoin("books as b", function () {
      this.on(db.raw("p.item_type"), db.raw("?", ["book"]));
      this.on(db.raw("p.item_id::text"), "=", db.raw("b.id::text"));
    })
    .where(function () {
      this.where("c.instructor_id", instructorId)
        .orWhere("tut.instructor_id", instructorId)
        .orWhere("b.instructor_id", instructorId);
    })
    .select(
      db.raw(
        `COALESCE(SUM(CASE WHEN p.status = ? THEN ${instructorColumn} ELSE 0 END), 0) as total_paid`,
        [STATUS.PAID]
      ),
      db.raw(
        `COALESCE(SUM(CASE WHEN p.status <> ? THEN ${instructorColumn} ELSE 0 END), 0) as total_pending`,
        [STATUS.PAID]
      ),
      db.raw(`COALESCE(SUM(${instructorColumn}), 0) as total_instructor_amount`),
      hasPlatformFee
        ? db.raw("COALESCE(SUM(p.platform_fee), 0) as total_platform_fee")
        : db.raw("0 as total_platform_fee"),
      db.raw("COALESCE(SUM(p.amount), 0) as total_gross")
    );

  return {
    totalPaid: Number(row?.total_paid || 0),
    totalPending: Number(row?.total_pending || 0),
    totalInstructorAmount: Number(row?.total_instructor_amount || 0),
    totalPlatformFee: Number(row?.total_platform_fee || 0),
    totalGross: Number(row?.total_gross || 0),
  };
};
