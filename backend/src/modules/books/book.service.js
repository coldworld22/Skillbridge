const db = require("../../config/database");

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
      this.whereILike("b.title", `%${search}%`).orWhereILike(
        "b.author",
        `%${search}%`
      );
    });
  }
  if (category) query.where("b.category_id", category);
  if (status) query.where("b.status", status);
  if (priceRange) query.where("b.price", "<=", priceRange);
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
  if (instructorId) query.where("b.instructor_id", instructorId);

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

exports.updateBook = async (id, data) => {
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
