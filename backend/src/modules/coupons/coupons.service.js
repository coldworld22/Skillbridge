const db = require("../../config/database");

exports.createCoupon = async (data) => {
  const payload = { ...data };
  if (payload.starts_at && !(payload.starts_at instanceof Date)) {
    payload.starts_at = new Date(payload.starts_at);
  }
  if (payload.expires_at && !(payload.expires_at instanceof Date)) {
    payload.expires_at = new Date(payload.expires_at);
  }
  if (payload.usage_limit === undefined) {
    delete payload.usage_limit;
  }
  const [row] = await db("coupons").insert(payload).returning("*");
  return row;
};

exports.getCoupons = ({ instructorId } = {}) => {
  const query = db("coupons").orderBy("created_at", "desc");
  if (instructorId) {
    query.where({ instructor_id: instructorId });
  }
  return query;
};

exports.getCouponById = (id) => {
  return db("coupons").where({ id }).first();
};

exports.getCouponByIdScoped = (id, { instructorId } = {}) => {
  const query = db("coupons").where({ id });
  if (instructorId) query.andWhere({ instructor_id: instructorId });
  return query.first();
};

exports.findByCode = (code) => {
  return db("coupons").whereRaw("LOWER(code) = LOWER(?)", [code]).first();
};

exports.incrementUsage = async (id) => {
  const [row] = await db("coupons")
    .where({ id })
    .increment("times_used", 1)
    .returning("*");
  return row;
};

exports.updateCoupon = async (id, data, { instructorId } = {}) => {
  const payload = { ...data };
  if (payload.starts_at === "") payload.starts_at = null;
  if (payload.expires_at === "") payload.expires_at = null;
  if (payload.starts_at && !(payload.starts_at instanceof Date)) {
    payload.starts_at = new Date(payload.starts_at);
  }
  if (payload.expires_at && !(payload.expires_at instanceof Date)) {
    payload.expires_at = new Date(payload.expires_at);
  }
  if (payload.usage_limit === "") payload.usage_limit = null;
  if (payload.usage_limit === undefined) delete payload.usage_limit;

  const query = db("coupons").where({ id });
  if (instructorId) query.andWhere({ instructor_id: instructorId });
  const [row] = await query.update(payload).returning("*");
  return row;
};

exports.deleteCoupon = (id, { instructorId } = {}) => {
  const query = db("coupons").where({ id });
  if (instructorId) query.andWhere({ instructor_id: instructorId });
  return query.del();
};

exports.getInstructorTargets = async (instructorId) => {
  if (!instructorId) return { classes: [], tutorials: [], books: [] };

  const [classes, tutorials, books] = await Promise.all([
    db("online_classes")
      .select("id", "title", "price", "status")
      .where({ instructor_id: instructorId })
      .orderBy("created_at", "desc"),
    db("tutorials")
      .select("id", "title", "price", "status")
      .where({ instructor_id: instructorId })
      .orderBy("created_at", "desc"),
    db("books")
      .select("id", "title", "price", "status")
      .where({ instructor_id: instructorId })
      .orderBy("created_at", "desc")
      .catch(() => []),
  ]);

  const mapRows = (rows = []) =>
    rows.map((row) => ({
      id: `${row.id}`,
      title: row.title,
      price: row.price == null ? null : Number(row.price),
      status: row.status || null,
    }));

  return {
    classes: mapRows(classes),
    tutorials: mapRows(tutorials),
    books: mapRows(books),
  };
};

exports.ensureInstructorOwnsItem = async ({ instructorId, appliesTo, itemId }) => {
  if (!instructorId || !appliesTo || !itemId) return null;

  const tableMap = {
    class: { table: "online_classes", idColumn: "id" },
    tutorial: { table: "tutorials", idColumn: "id" },
    book: { table: "books", idColumn: "id" },
  };
  const config = tableMap[appliesTo];
  if (!config) return null;

  const row = await db(config.table)
    .select(config.idColumn)
    .where({ [config.idColumn]: itemId, instructor_id: instructorId })
    .first();

  return row || null;
};
