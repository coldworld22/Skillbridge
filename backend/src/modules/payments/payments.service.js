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
      db.schema.hasColumn("payments", "tenant_id"),
    ]).then(([hasPlatformFee, hasInstructorAmount, hasSource, hasTenantId]) => ({
      hasPlatformFee,
      hasInstructorAmount,
      hasSource,
      hasTenantId,
    }));
  }
  return paymentColumnInfoPromise;
};

const normalizeTenantPayload = async (payload, tenantId = null) => {
  const { hasTenantId } = await getPaymentColumnInfo();
  const data = { ...payload };
  if (hasTenantId) {
    const resolvedTenant = tenantId || data.tenant_id || null;
    if (!resolvedTenant) {
      throw new AppError("tenant_id is required for payments");
    }
    data.tenant_id = resolvedTenant;
  } else {
    delete data.tenant_id;
  }
  return data;
};

const applyTenantScope = (query, tenantId, columnInfo, alias = "p") => {
  if (columnInfo?.hasTenantId && tenantId) {
    query.andWhere(`${alias}.tenant_id`, tenantId);
  }
  return query;
};

exports.create = async (data, schedules = [], trx) => {
  const normalizeItemId = (value) =>
    value === undefined || value === null ? value : String(value);
  const record = await normalizeTenantPayload(
    { ...data, item_id: normalizeItemId(data.item_id) },
    data?.tenant_id || null
  );
  const run = async (transaction) => {
    const [row] = await transaction("payments").insert(record).returning("*");
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

exports.findInstallmentContext = async (
  userId,
  itemType,
  itemId,
  tenantId = null
) => {
  if (!userId || !itemType || itemId === undefined || itemId === null) {
    return { payment: null, schedule: null };
  }
  const columnInfo = await getPaymentColumnInfo();
  if (columnInfo.hasTenantId && !tenantId) {
    return { payment: null, schedule: null };
  }
  const normalizedItemId = String(itemId);
  const payment = await db("payments")
    .where({
      user_id: userId,
      item_type: itemType,
      item_id: normalizedItemId,
    })
    .andWhere("installments", ">", 1)
    .orderBy("created_at", "asc")
    .modify((qb) => applyTenantScope(qb, tenantId, columnInfo, "payments"))
    .first();

  if (!payment) {
    return { payment: null, schedule: null };
  }

  const schedule = await db("payment_schedules")
    .where({ payment_id: payment.id })
    .whereIn("status", ["pending", "awaiting_payment"])
    .orderBy("installment_number")
    .first();

  return { payment, schedule };
};

exports.getAll = async (status, methodType, tenantId = null) => {
  const columnInfo = await getPaymentColumnInfo();
  const { hasPlatformFee, hasInstructorAmount, hasSource, hasTenantId } =
    columnInfo;

  if (hasTenantId && !tenantId) {
    return [];
  }

  const query = db({ p: "payments" })
    .leftJoin("users as u", "p.user_id", "u.id")
    .leftJoin("payment_methods_config as m", "p.method_id", "m.id")
    .leftJoin("online_classes as c", function () {
      this.on("p.item_id", "=", db.raw("c.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["class"])
      );
    })
    .leftJoin("tutorials as tut", function () {
      this.on("p.item_id", "=", db.raw("tut.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["tutorial"])
      );
    })
    .leftJoin("books as b", function () {
      this.on(db.raw("p.item_type"), db.raw("?", ["book"]));
      this.on(db.raw("p.item_id::text"), "=", db.raw("b.id::text"));
    })
    .leftJoin("users as inst_class", "c.instructor_id", "inst_class.id")
    .leftJoin("users as inst_tut", "tut.instructor_id", "inst_tut.id")
    .leftJoin("users as inst_book", "b.instructor_id", "inst_book.id")
    .select(
      "p.id",
      "p.user_id",
      "p.method_id",
      "p.item_type",
      "p.item_id",
      "p.amount",
      "p.currency",
      "p.status",
      "p.reference_id",
      "p.installments",
      "p.installment_number",
      "p.next_due_date",
      "p.paid_at",
      "p.created_at",
      "p.updated_at",
      "p.coupon_id",
      "u.full_name as user_name",
      "u.email as user_email",
      "u.role as user_role",
      "m.name as method_name",
      db.raw("COALESCE(c.title, tut.title, b.title) as item_title"),
      db.raw("COALESCE(c.price, tut.price, b.price) as item_price"),
      db.raw("COALESCE(inst_class.full_name, inst_tut.full_name, inst_book.full_name) as instructor_name"),
      db.raw("COALESCE(inst_class.email, inst_tut.email, inst_book.email) as instructor_email")
    )
    .orderBy("p.created_at", "desc");

  applyTenantScope(query, tenantId, columnInfo);

  if (status) {
    query.where("p.status", status);
  }

  if (methodType) {
    query.andWhere("m.type", methodType);
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

exports.getByUser = async (userId, filters = {}, tenantIdArg = null) => {
  let statusFilter = null;
  let itemTypeFilter = null;
  let limit = null;
  let offset = null;
  let sortDirection = "desc";
  let tenantId = tenantIdArg;

  if (typeof filters === "string") {
    statusFilter = filters;
  } else if (filters && typeof filters === "object") {
    if (!tenantId && filters.tenantId) {
      tenantId = filters.tenantId;
    }
    statusFilter =
      filters.status === undefined ? null : String(filters.status);
    itemTypeFilter =
      filters.itemType === undefined ? null : String(filters.itemType);
    if (filters.limit !== undefined) {
      const parsed = Number(filters.limit);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.floor(parsed);
      }
    }
    if (filters.offset !== undefined) {
      const parsed = Number(filters.offset);
      if (Number.isFinite(parsed) && parsed >= 0) {
        offset = Math.floor(parsed);
      }
    }
    if (typeof filters.sortDirection === "string") {
      const normalized = filters.sortDirection.toLowerCase();
      if (normalized === "asc" || normalized === "desc") {
        sortDirection = normalized;
      }
    }
  } else if (filters !== null && filters !== undefined) {
    statusFilter = String(filters);
  }

  const columnInfo = await getPaymentColumnInfo();
  const { hasPlatformFee, hasInstructorAmount, hasSource, hasTenantId } =
    columnInfo;

  if (hasTenantId && !tenantId) {
    return [];
  }

  const query = db({ p: "payments" })
    .leftJoin("payment_methods_config as m", "p.method_id", "m.id")
    .leftJoin("invoices as inv", "inv.payment_id", "p.id")
    .leftJoin("online_classes as c", function () {
      this.on("p.item_id", "=", db.raw("c.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["class"])
      );
    })
    .leftJoin("tutorials as tut", function () {
      this.on("p.item_id", "=", db.raw("tut.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["tutorial"])
      );
    })
    .leftJoin("books as b", function () {
      this.on("p.item_id", "=", db.raw("b.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["book"])
      );
    })
    .leftJoin("plans as pl", function () {
      this.on("p.item_id", "=", db.raw("pl.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["plan"])
      );
    })
    .select(
      "p.*",
      "m.name as method_name",
      "c.title as class_title",
      "tut.title as tutorial_title",
      "b.title as book_title",
      "pl.name as plan_name",
      "pl.slug as plan_slug",
      "pl.price_monthly",
      "pl.price_yearly",
      "inv.id as invoice_id",
      "inv.pdf_url as invoice_pdf_url",
      "inv.created_at as invoice_created_at",
      db.raw(
        "COALESCE(c.title, tut.title, b.title, pl.name) as item_title"
      )
    )
    .where("p.user_id", userId);

  applyTenantScope(query, tenantId, columnInfo);

  if (statusFilter) {
    query.andWhere("p.status", statusFilter);
  }

  if (itemTypeFilter) {
    query.andWhere("p.item_type", itemTypeFilter);
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

  query.orderBy("p.created_at", sortDirection);

  if (offset !== null) {
    query.offset(offset);
  }

  if (limit !== null) {
    query.limit(limit);
  }

  return query;
};

exports.getById = async (id, tenantId = null) => {
  const columnInfo = await getPaymentColumnInfo();
  const query = db("payments").where({ id });
  applyTenantScope(query, tenantId, columnInfo);
  return query.first();
};

exports.update = async (id, data, tenantId = null) => {
  const columnInfo = await getPaymentColumnInfo();
  const tenantScope = tenantId || data?.tenant_id || null;
  if (columnInfo.hasTenantId && !tenantScope) {
    throw new AppError("tenant_id is required to update payments");
  }
  const payload = await normalizeTenantPayload(data, tenantScope);
  const query = db("payments").where({ id });
  applyTenantScope(query, tenantScope, columnInfo);
  const [row] = await query.update(payload).returning("*");
  return row;
};

exports.delete = async (id, tenantId = null) => {
  const columnInfo = await getPaymentColumnInfo();
  if (columnInfo.hasTenantId && !tenantId) {
    throw new AppError("tenant_id is required to delete payments");
  }
  const query = db("payments").where({ id });
  applyTenantScope(query, tenantId, columnInfo);
  return query.del();
};

exports.approveBankPayment = async (
  id,
  { amount, item_id, item_type } = {},
  tenantId = null
) => {
  const columnInfo = await getPaymentColumnInfo();
  if (columnInfo.hasTenantId && !tenantId) {
    throw new AppError("tenant_id is required to approve payments");
  }
  return db.transaction(async (trx) => {
    const paymentQuery = trx("payments").where({ id }).forUpdate();
    applyTenantScope(paymentQuery, tenantId, columnInfo, "payments");
    const payment = await paymentQuery.first();
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

    const updateQuery = trx("payments").where({ id });
    applyTenantScope(updateQuery, tenantId, columnInfo, "payments");
    const [row] = await updateQuery
      .update({ status: STATUS.PAID, paid_at: new Date() })
      .returning("*");

    return row;
  });
};

exports.rejectBankPayment = async (
  id,
  { amount, item_id, item_type } = {},
  tenantId = null
) => {
  const columnInfo = await getPaymentColumnInfo();
  if (columnInfo.hasTenantId && !tenantId) {
    throw new AppError("tenant_id is required to reject payments");
  }
  return db.transaction(async (trx) => {
    const paymentQuery = trx("payments").where({ id }).forUpdate();
    applyTenantScope(paymentQuery, tenantId, columnInfo, "payments");
    const payment = await paymentQuery.first();
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

    const updateQuery = trx("payments").where({ id });
    applyTenantScope(updateQuery, tenantId, columnInfo, "payments");
    const [row] = await updateQuery
      .update({ status: STATUS.REJECTED })
      .returning("*");

    return row;
  });
};

exports.getByInstructor = async (
  instructorId,
  { status, itemType, tenantId = null } = {}
) => {
  const columnInfo = await getPaymentColumnInfo();
  const { hasPlatformFee, hasInstructorAmount, hasSource, hasTenantId } =
    columnInfo;

  if (hasTenantId && !tenantId) {
    return [];
  }

  const query = db({ p: "payments" })
    .leftJoin("payment_methods_config as m", "p.method_id", "m.id")
    .leftJoin("online_classes as c", function () {
      this.on("p.item_id", "=", db.raw("c.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["class"])
      );
    })
    .leftJoin("tutorials as tut", function () {
      this.on("p.item_id", "=", db.raw("tut.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["tutorial"])
      );
    })
    // Cast IDs to text so the payments.item_id text column can match the source tables
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

  applyTenantScope(query, tenantId, columnInfo);

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

exports.getInstructorTotals = async (instructorId, tenantId = null) => {
  const columnInfo = await getPaymentColumnInfo();
  const { hasPlatformFee, hasInstructorAmount, hasTenantId } = columnInfo;

  if (hasTenantId && !tenantId) {
    return {
      totalPaid: 0,
      totalPending: 0,
      totalInstructorAmount: 0,
      totalPlatformFee: 0,
      totalGross: 0,
    };
  }

  const [classesHasTenant, tutorialsHasTenant, booksHasTenant] =
    await Promise.all([
      db.schema.hasColumn("online_classes", "tenant_id").catch(() => false),
      db.schema.hasColumn("tutorials", "tenant_id").catch(() => false),
      db.schema.hasColumn("books", "tenant_id").catch(() => false),
    ]);

  const instructorColumn = hasInstructorAmount
    ? "p.instructor_amount"
    : "p.amount";

  const query = db({ p: "payments" })
    .leftJoin("online_classes as c", function () {
      this.on("p.item_id", "=", db.raw("c.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["class"])
      );
      if (classesHasTenant && tenantId) {
        this.andOn("c.tenant_id", "=", db.raw("?", [tenantId]));
      }
    })
    .leftJoin("tutorials as tut", function () {
      this.on("p.item_id", "=", db.raw("tut.id::text")).andOn(
        "p.item_type",
        "=",
        db.raw("?", ["tutorial"])
      );
      if (tutorialsHasTenant && tenantId) {
        this.andOn("tut.tenant_id", "=", db.raw("?", [tenantId]));
      }
    })
    // Cast IDs to text so the payments.item_id text column can match the source tables
    .leftJoin("books as b", function () {
      this.on(db.raw("p.item_type"), db.raw("?", ["book"]));
      this.on(db.raw("p.item_id::text"), "=", db.raw("b.id::text"));
      if (booksHasTenant && tenantId) {
        this.andOn("b.tenant_id", "=", db.raw("?", [tenantId]));
      }
    })
    .where(function () {
      this.where("c.instructor_id", instructorId)
        .orWhere("tut.instructor_id", instructorId)
        .orWhere("b.instructor_id", instructorId);
    });

  applyTenantScope(query, tenantId, columnInfo);

  const [row] = await query.select(
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
