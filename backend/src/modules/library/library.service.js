const db = require("../../config/database");

exports.listForStudent = async (studentId) => {
  const rows = await db("book_purchases as bp")
    .join("books as b", "bp.book_id", "b.id")
    .leftJoin("users as u", "b.instructor_id", "u.id")
    .where("bp.student_id", studentId)
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
      "u.full_name as author"
    )
    .orderBy("bp.purchased_at", "desc");

  const tagMap = {};
  if (rows.length) {
    const tagRows = await db("book_tag_map as btm")
      .leftJoin("tags as t", "btm.tag_id", "t.id")
      .whereIn(
        "btm.book_id",
        rows.map((row) => row.id)
      )
      .select("btm.book_id", "t.name");

    tagRows.forEach((tag) => {
      if (!tagMap[tag.book_id]) tagMap[tag.book_id] = [];
      if (tag.name) tagMap[tag.book_id].push(tag.name);
    });
  }

  return rows.map((row) => {
    let previewPages;
    try {
      previewPages = Array.isArray(row.preview_pages)
        ? row.preview_pages
        : JSON.parse(row.preview_pages || "[]");
    } catch {
      previewPages = [];
    }

    return {
      id: row.id,
      title: row.title,
      shortDescription: row.short_description,
      author: row.author,
      tags: tagMap[row.id] || [],
      isFree: Number(row.price_paid) === 0,
      price_paid: Number(row.price_paid),
      purchasedAt: row.purchased_at,
      cover_image_url: row.cover_image_url,
      pdf_url: row.pdf_url,
      preview_url:
        row.allow_preview && previewPages.length ? previewPages[0] : null,
    };
  });
};

exports.recordPurchase = async (studentId, bookId, pricePaid) => {
  // Avoid duplicate library rows if the same book is granted multiple times
  // via different payment flows or repeated callbacks.
  const existing = await db("book_purchases")
    .where({ student_id: studentId, book_id: bookId })
    .first();
  if (existing) return existing;
  const [row] = await db("book_purchases")
    .insert({
      student_id: studentId,
      book_id: bookId,
      price_paid: pricePaid,
    })
    .returning("*");
  return row;
};

exports.getBookForDownload = async (studentId, bookId) => {
  return db("book_purchases as bp")
    .join("books as b", "bp.book_id", "b.id")
    .where({ "bp.student_id": studentId, "bp.book_id": bookId })
    .select("b.pdf_url", "b.title")
    .first();
};
