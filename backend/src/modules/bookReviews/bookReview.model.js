const db = require("../../config/database");

exports.create = (data) => {
  return db("book_reviews").insert(data).returning("*");
};

exports.findById = (id) => {
  return db("book_reviews").where({ id }).first();
};

exports.listByBook = (book_id) => {
  return db("book_reviews as br")
    .leftJoin("users as u", "br.user_id", "u.id")
    .select(
      "br.*",
      "u.full_name as reviewer_full_name",
      "u.email as reviewer_email",
      "u.avatar_url as reviewer_avatar"
    )
    .where("br.book_id", book_id)
    .orderBy("br.created_at", "desc");
};

exports.update = (id, data) => {
  return db("book_reviews")
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning("*");
};

exports.remove = (id) => db("book_reviews").where({ id }).del();

exports.averageRating = async (book_id) => {
  const row = await db("book_reviews")
    .where({ book_id })
    .avg("rating as avg")
    .first();
  return row?.avg ? Number(row.avg) : 0;
};
