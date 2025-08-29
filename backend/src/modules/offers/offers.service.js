const db = require("../../config/database");

exports.createOffer = async (data) => {
  const [row] = await db("offers").insert(data).returning("*");
  return row;
};

// Determine the fee to charge for an offer based on the creator's plan
exports.calculateOfferFee = (user) => {
  if (user?.role?.toLowerCase() !== "instructor") return 0;
  // Instructors with a premium plan do not pay a fee
  const plan = user.plan || user.subscription || "";
  if (typeof plan === "string" && plan.toLowerCase() === "premium") {
    return 0;
  }
  // Default fee for non-premium instructors
  return 10; // flat fee; could be fetched from configuration later
};

// Summarise offers associated with a specific group
exports.getGroupOfferSummary = async (groupId) => {
  const row = await db("offers")
    .where({ group_id: groupId })
    .count("id as count")
    .sum({ total_fee: "fee" })
    .first();
  return {
    count: Number(row?.count || 0),
    total_fee: Number(row?.total_fee || 0),
  };
};

exports.getOffers = () => {
  return db("offers as o")
    .join("users as u", "o.student_id", "u.id")
    .select(
      "o.*",
      "u.full_name as student_name",
      "u.role as student_role",
      "u.avatar_url as student_avatar",
      "u.email as student_email",
      "u.phone as student_phone"
    )
    .where("o.status", "open")
    .andWhere(function () {
      this.whereNull("o.expires_at").orWhere("o.expires_at", ">", db.fn.now());
    })
    .orderBy("o.created_at", "desc");
};

exports.getOfferById = (id) => {
  return db("offers as o")
    .join("users as u", "o.student_id", "u.id")
    .select(
      "o.*",
      "u.full_name as student_name",
      "u.role as student_role",
      "u.avatar_url as student_avatar",
      "u.email as student_email",
      "u.phone as student_phone"
    )
    .where("o.id", id)
    .andWhere(function () {
      this.whereNull("o.expires_at").orWhere("o.expires_at", ">", db.fn.now());
    })
    .first();
};

exports.updateOffer = async (id, data) => {
  const [row] = await db("offers").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteOffer = (id) => {
  return db("offers").where({ id }).del();
};

exports.deleteExpiredOffers = () => {
  return db("offers")
    .whereNotNull("expires_at")
    .andWhere("expires_at", "<", db.fn.now())
    .del();
};

exports.addOfferTags = async (offerId, tagIds) => {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ offer_id: offerId, tag_id }));
  await db("offer_tag_map").insert(rows);
};

exports.getOfferTags = async (offerId) => {
  return db("offer_tag_map as m")
    .join("offer_tags as t", "m.tag_id", "t.id")
    .where("m.offer_id", offerId)
    .select("t.id", "t.name", "t.slug");
};
