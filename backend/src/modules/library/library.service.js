const db = require("../../config/database");

exports.listForStudent = async (studentId) => {
  const rows = await db("book_purchases as bp")
    .join("books as b", "bp.book_id", "b.id")
    .leftJoin("users as u", "b.instructor_id", "u.id")
    .leftJoin("book_tag_map as btm", "b.id", "btm.book_id")
    .leftJoin("tags as t", "btm.tag_id", "t.id")
    .where("bp.student_id", studentId)
    .groupBy(
      "b.id",
      "b.title",
      "b.short_description",
      "b.pdf_url",
      "b.cover_image_url",
      "b.preview_pages",
      "b.allow_preview",
      "b.price",
      "bp.price_paid",
      "bp.purchased_at",
      "u.full_name"
    )
    .select(
      "b.id",
      "b.title",
      "b.short_description",
      "b.pdf_url",
      "b.cover_image_url",
      "b.preview_pages",
      "b.allow_preview",
      "b.price",
      "bp.price_paid",
      "bp.purchased_at",
      "u.full_name as author",
      db.raw(
        "COALESCE(json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') as tags"
      )
    )
    .orderBy("bp.purchased_at", "desc");

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    shortDescription: row.short_description,
    author: row.author,
    tags: row.tags || [],
    isFree: Number(row.price_paid) === 0,
    price: Number(row.price_paid),
    purchasedAt: row.purchased_at,
    coverUrl: row.cover_image_url,
    pdfUrl: row.pdf_url,
    previewUrl:
      row.allow_preview && row.preview_pages?.length
        ? row.preview_pages[0]
        : null,
  }));
};
