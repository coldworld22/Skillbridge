const db = require("../../config/database");
const { PRICE_RANGE_MAX } = require("../../config/books");
const fs = require("fs");
const path = require("path");
const tagService = require("./bookTag.service");
const slugify = require("slugify");
const AppError = require("../../utils/AppError");
const paymentsService = require("../payments/payments.service");
const paymentMethodsService = require("../paymentMethods/paymentMethods.service");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");
const libraryService = require("../library/library.service");
const { v4: uuidv4 } = require("uuid");
const { getActiveStudentSubscription } = require("../plans/subscription.helper");
const planRevenue = require("../payments/helpers/planRevenue");
const { getPlanCoveredMethod } = require("../payments/helpers/methods");

const { STATUS: PAYMENT_STATUS } = paymentsService;

const getSubscriptionPaymentMethod = async () => {
  const method =
    (await paymentMethodsService.getByType("subscription")) ||
    (await paymentMethodsService.getByType("free"));

  if (!method) {
    throw new AppError("Subscription payment method not configured", 400);
  }

  return method;
};

const DEFAULT_PLATFORM_CUT = { book: 10 };

exports.createBook = async (data) => {
  const insertData = { included_plans: [], ...data };
  if (!insertData.included_plans) insertData.included_plans = [];
  const [row] = await db("books").insert(insertData).returning("*");
  return row;
};

const { parsePagination } = require("../../utils/pagination");

exports.listBooks = async (params = {}) => {
  const {
    search,
    category,
    status,
    priceRange,
    language,
    tags = [],
    sortBy = "newest",
    instructorId,
  } = params;

  const { page, limit: perPage, offset } = parsePagination({
    page: params.page,
    limit: params.perPage,
  });

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
  const parsedPriceRange = Number(priceRange);
  if (Number.isFinite(parsedPriceRange) && parsedPriceRange >= 0)
    query.where("b.price", "<=", Math.min(parsedPriceRange, PRICE_RANGE_MAX));
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

  const books = await query.clone().offset(offset).limit(perPage);

  return {
    data: books,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
};

exports.getBookById = (id) => db("books").where({ id }).first();

exports.addBookTags = async (bookId, tagIds, trx = db) => {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ book_id: bookId, tag_id }));
  await trx("book_tag_map").insert(rows);
};

exports.getBookTags = (bookId, trx = db) =>
  trx("book_tag_map as m")
    .join("tags as t", "m.tag_id", "t.id")
    .where("m.book_id", bookId)
    .select("t.id", "t.name", "t.slug");

exports.clearBookTags = (bookId, trx = db) =>
  trx("book_tag_map").where({ book_id: bookId }).del();

exports.updateBookTags = async (bookId, rawTags) => {
  let tags = [];
  if (rawTags) {
    try {
      tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }
  }

  const tagIds = [];
  for (const name of tags) {
    const existing = await tagService.findByName(name);
    const tag =
      existing ||
      (await tagService.createTag({
        name,
        slug: slugify(name, { lower: true, strict: true }),
      }));
    tagIds.push(tag.id);
  }

  await db.transaction(async (trx) => {
    await exports.clearBookTags(bookId, trx);
    if (tagIds.length) await exports.addBookTags(bookId, tagIds, trx);
  });

  return exports.getBookTags(bookId);
};

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
  const fields = [];
  if (removePreviewPages || data.preview_pages) fields.push("preview_pages");
  if (data.cover_image_url) fields.push("cover_image_url");
  if (data.pdf_url) fields.push("pdf_url");

  let existing = null;
  if (fields.length) {
    existing = await db("books").where({ id }).select(fields).first();
  }

  if (removePreviewPages || data.preview_pages) {
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

  if (data.cover_image_url && existing?.cover_image_url) {
    await removeFiles([existing.cover_image_url]);
  }

  if (data.pdf_url && existing?.pdf_url) {
    await removeFiles([existing.pdf_url]);
  }

  const updateData = { ...data };
  if (updateData.included_plans === undefined) delete updateData.included_plans;
  const [row] = await db("books").where({ id }).update(updateData).returning("*");
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
  const bankMethod = await paymentMethodsService.getByType('bank');
  if (!bankMethod) throw new AppError('Bank payment method not configured', 400);

  const activeSubscription = await getActiveStudentSubscription(studentId);
  const activePlanId = activeSubscription?.plan_id;
  const activeSubscriptionId = activeSubscription?.id;
  let subscriptionMethod = null;

  return db.transaction(async (trx) => {
    const items = await trx('book_cart')
      .where({ student_id: studentId })
      .select('book_id');
    if (!items.length) return [];

    const bookIds = items.map((i) => i.book_id);

    const existing = await trx('book_purchases')
      .where({ student_id: studentId })
      .whereIn('book_id', bookIds)
      .select('book_id');
    if (existing.length) {
      const ids = existing.map((e) => e.book_id).join(', ');
      throw new AppError(`Book already purchased: ${ids}`, 409);
    }

    const books = await trx('books')
      .whereIn('id', bookIds)
      .where('status', 'active')
      .select('id', 'price', 'included_plans');

    if (books.length !== bookIds.length) {
      const validIds = books.map((b) => b.id);
      const missing = bookIds.filter((id) => !validIds.includes(id));
      throw new AppError(`Book inactive or not found: ${missing.join(', ')}`, 404);
    }

    let settings = null;
    try {
      settings = await paymentConfigService.getSettings();
    } catch (err) {
      settings = null;
    }

    const payments = [];
    let planMethodRecord = null;
    for (const b of books) {
      const includedPlans = Array.isArray(b.included_plans) ? b.included_plans : [];
      const coveredBySubscription = activePlanId && includedPlans.includes(activePlanId);

      if (coveredBySubscription) {
        if (!planMethodRecord) {
          planMethodRecord = await getPlanCoveredMethod(trx);
        }

        const instructorShare = await planRevenue.calculateInstructorAmount(
          activePlanId,
          activeSubscriptionId,
          b.id,
          trx,
          'book'
        );
        const [payment] = await trx('payments')
          .insert({
            id: uuidv4(),
            user_id: studentId,
            method_id: planMethodRecord.id,
            item_type: 'book',
            item_id: b.id,
            amount: 0,
            status: PAYMENT_STATUS.PAID,
            method_id: subscriptionMethod.id,
            source: 'subscription',
            paid_at: new Date(),
          },
          [],
          trx
        );

        await trx('book_purchases').insert({
          student_id: studentId,
          book_id: b.id,
          price_paid: 0,
        });

        await creditInstructorSubscription(
          'book',
          b.id,
          activePlanId,
          activeSubscriptionId,
          trx,
          instructorShare
        );

        payments.push(payment);
        continue;
      }

      let platform_fee = 0;
      let instructor_amount = Number(b.price);
      try {
        const cut =
          settings?.platformCut?.book ?? DEFAULT_PLATFORM_CUT.book;
        platform_fee = (Number(b.price) * cut) / 100;
        instructor_amount = Number(b.price) - platform_fee;
      } catch (_) {}

      const paymentData = {
        id: uuidv4(),
        user_id: studentId,
        method_id: bankMethod.id,
        item_type: 'book',
        item_id: b.id,
        amount: b.price,
        status: PAYMENT_STATUS.AWAITING_APPROVAL,
        platform_fee,
        instructor_amount,
      };

      // Use the existing transaction to avoid nesting and potential
      // database locks during tests.
      const payment = await paymentsService.create(paymentData, [], trx);
      if (payment.status === PAYMENT_STATUS.PAID) {
        await libraryService.recordPurchase(studentId, b.id, b.price);
      }
      payments.push(payment);
    }

    await trx('book_cart')
      .where({ student_id: studentId })
      .whereIn('book_id', bookIds)
      .del();

    return payments;
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

