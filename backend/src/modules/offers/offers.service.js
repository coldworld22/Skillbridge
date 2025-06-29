const db = require("../../config/database");

exports.createOffer = async (data) => {
  const [row] = await db("offers").insert(data).returning("*");
  return row;
};

exports.getOffers = () => {
  return db("offers as o")
    .join("users as u", "o.student_id", "u.id")
    .select(
      "o.*",
      "u.full_name as student_name",
      "u.role as student_role",
      "u.avatar_url as student_avatar"
    )
    .where("o.status", "open")
    .orderBy("o.created_at", "desc");
};

exports.getOfferById = (id) => {
  return db("offers as o")
    .join("users as u", "o.student_id", "u.id")
    .select(
      "o.*",
      "u.full_name as student_name",
      "u.role as student_role",
      "u.avatar_url as student_avatar"
    )
    .where("o.id", id)
    .first();
};

exports.updateOffer = async (id, data) => {
  const [row] = await db("offers").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteOffer = (id) => {
  return db("offers").where({ id }).del();
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
