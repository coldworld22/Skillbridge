const db = require("../../config/database");
const { PRICE_RANGE_MAX } = require("../../config/books");
const fs = require("fs");
const path = require("path");

exports.createBook = async (data) => {
  const [row] = await db("books").insert(data).returning("*");
  return row;
};

exports.listBooks = async (params = {}) => {
  const {
    page = 1,
    perPage = 10,
    search,
    category,
    status,
    priceRange,
    language,
    tags = [],
    sortBy = "newest",
    instructorId,
  } = params;

  const query = db("books as b");

  if (search) {
    query.where(function () {
      this.whereILike("b.title", `%${search}%`)
        .orWhereILike("b.author", `%${search}%`)
        .orWhereILike("b.short_description", `%${search}%`)
        .orWhereILike("b.detailed_description", `%${search}%`);
    });
  }
  if (category) query.where("b.category_id", category);
  if (status) query.where("b.status", status);
  if (priceRange)
    query.where("b.price", "<=", Math.min(priceRange, PRICE_RANGE_MAX));
  if (language) query.where("b.language", language);
  if (instructorId) query.where("b.instructor_id", instructorId);
  const tagArr = Array.isArray(tags) ? tags : tags ? [tags] : [];
  if (tagArr.length) {
    query.whereIn("b.id", function () {
      this.select("m.book_id")
        .from("book_tag_map as m")
        .join("tags as t", "m.tag_id", "t.id")
        .whereIn("t.name", tagArr);
    });
  }

  switch (sortBy) {
    case "oldest":
      query.orderBy("b.created_at", "asc");
      break;
    case "title":
      query.orderBy("b.title", "asc");
      break;
    case "price-high":
      query.orderBy("b.price", "desc");
      break;
    case "price-low":
      query.orderBy("b.price", "asc");
      break;
    default:
      query.orderBy("b.created_at", "desc");
  }

  const countQuery = query
    .clone()
    .clearSelect()
    .clearOrder()
    .countDistinct("b.id as count")
    .first();
  const { count } = await countQuery;
  const total = Number(count) || 0;

  const books = await query
    .clone()
    .offset((page - 1) * perPage)
    .limit(perPage);

  return {
    data: books,
    meta: {
      page: Number(page),
      perPage: Number(perPage),
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
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

exports.clearBookTags = (bookId) =>
  db("book_tag_map").where({ book_id: bookId }).del();

const removeFiles = async (files = []) => {
  await Promise.all(
    files.map((f) =>
      fs.promises
        .unlink(
          path.join(
            __dirname,
            "../../../",
            f.startsWith("/") ? f.slice(1) : f
          )
        )
        .catch(() => {})
    )
  );
};

exports.updateBook = async (id, data, { removePreviewPages = false } = {}) => {
  if (removePreviewPages || data.preview_pages) {
    const existing = await db("books")
      .where({ id })
      .select("preview_pages")
      .first();
    let prev = [];
    if (existing?.preview_pages) {
      if (Array.isArray(existing.preview_pages)) prev = existing.preview_pages;
      else {
        try {
          prev = JSON.parse(existing.preview_pages) || [];
        } catch {
          prev = [];
        }
      }
    }
    await removeFiles(prev);
    if (removePreviewPages && !data.preview_pages) {
      data.preview_pages = null;
    }
  }
  const [row] = await db("books").where({ id }).update(data).returning("*");
  return row;
};

exports.updateBookStatus = async (id, status) => {
  const [row] = await db("books").where({ id }).update({ status }).returning("*");
  return row;
};

exports.deleteBook = (id) => db("books").where({ id }).del();

exports.getInstructorBookAnalytics = async (instructorId) => {
  const totalSalesRow = await db("book_purchases as p")
    .join("books as b", "p.book_id", "b.id")
    .where("b.instructor_id", instructorId)
    .count("* as totalSales")
    .first();

  const totalRevenueRow = await db("book_purchases as p")
    .join("books as b", "p.book_id", "b.id")
    .where("b.instructor_id", instructorId)
    .sum("p.price_paid as totalRevenue")
    .first();

  const topBooks = await db("book_purchases as p")
    .join("books as b", "p.book_id", "b.id")
    .where("b.instructor_id", instructorId)
    .select("b.id", "b.title")
    .count("* as sales")
    .groupBy("b.id", "b.title")
    .orderBy("sales", "desc")
    .limit(5);

  return {
    totalSales: Number(totalSalesRow?.totalSales || 0),
    totalRevenue: Number(totalRevenueRow?.totalRevenue || 0),
    topBooks: topBooks.map((b) => ({
      id: b.id,
      title: b.title,
      sales: Number(b.sales),
    })),
  };
};

exports.addToCart = async (studentId, bookId) => {
  const [row] = await db('book_cart')
    .insert({ student_id: studentId, book_id: bookId })
    .onConflict(['student_id', 'book_id'])
    .merge({ quantity: db.raw('book_cart.quantity + 1') })
    .returning('*');
  return row;
};

exports.removeFromCart = (studentId, bookId) =>
  db('book_cart').where({ student_id: studentId, book_id: bookId }).del();

exports.checkout = async (studentId) => {
  return db.transaction(async (trx) => {
    const items = await trx('book_cart')
      .where({ student_id: studentId })
      .select('book_id');
    if (!items.length) return [];
    const books = await trx('books')
      .whereIn('id', items.map((i) => i.book_id))
      .select('id', 'price');
    const rows = books.map((b) => ({
      student_id: studentId,
      book_id: b.id,
      price_paid: b.price,
    }));
    const purchases = await trx('book_purchases')
      .insert(rows)
      .returning('*');
    await trx('book_cart').where({ student_id: studentId }).del();
    return purchases;
  });
};

exports.addToWishlist = async (studentId, bookId) => {
  const [row] = await db('book_wishlist')
    .insert({ student_id: studentId, book_id: bookId })
    .onConflict(['student_id', 'book_id'])
    .ignore()
    .returning('*');
  return row;
};

exports.removeFromWishlist = (studentId, bookId) =>
  db('book_wishlist').where({ student_id: studentId, book_id: bookId }).del();

