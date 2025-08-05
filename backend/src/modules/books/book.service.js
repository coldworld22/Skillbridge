const db = require("../../config/database");

exports.createBook = async (data) => {
  const [row] = await db("books").insert(data).returning("*");
  return row;
};

exports.listBooks = (status) => {
  const query = db("books").orderBy("created_at", "desc");
  if (status) query.where({ status });
  return query;
};

exports.getBookById = (id) => db("books").where({ id }).first();

exports.addBookTags = async (bookId, tagIds) => {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ book_id: bookId, tag_id }));
  await db("book_tag_map").insert(rows);
};

exports.getBookTags = (bookId) =>
  db("book_tag_map as m")
    .join("tags as t", "m.tag_id", "t.id")
    .where("m.book_id", bookId)
    .select("t.id", "t.name", "t.slug");
