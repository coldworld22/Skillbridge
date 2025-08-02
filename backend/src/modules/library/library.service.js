const db = require("../../config/database");

exports.listForStudent = (studentId) =>
  db("book_purchases as bp")
    .join("books as b", "bp.book_id", "b.id")
    .select(
      "b.id",
      "b.title",
      "b.cover_image_url",
      "bp.price_paid",
      "bp.purchased_at"
    )
    .where("bp.student_id", studentId)
    .orderBy("bp.purchased_at", "desc");
