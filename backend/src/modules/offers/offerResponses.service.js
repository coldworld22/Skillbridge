const db = require("../../config/database");

exports.createResponse = async (data) => {
  const [row] = await db("offer_responses").insert(data).returning("*");
  return row;
};

exports.getResponsesByOffer = (offerId) => {
  return db("offer_responses as r")
    .join("users as u", "r.instructor_id", "u.id")
    .select(
      "r.*",
      "u.full_name as instructor_name",
      "u.avatar_url as instructor_avatar"
    )
    .where("r.offer_id", offerId)
    .orderBy("r.responded_at", "asc");
};

exports.getResponseWithOffer = (id) => {
  return db("offer_responses as r")
    .join("offers as o", "r.offer_id", "o.id")
    .select("r.*", "o.student_id")
    .where("r.id", id)
    .first();
};
