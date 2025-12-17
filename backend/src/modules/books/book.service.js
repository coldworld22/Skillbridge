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
const {
  getActiveStudentSubscription,
} = require("../plans/subscription.helper");
const walletService = require("../payouts/wallet.service");
const { creditInstructorSubscription } = require("../payments/helpers/wallet");
const planRevenue = require("../payments/helpers/planRevenue");

const { STATUS: PAYMENT_STATUS } = paymentsService;

const DEFAULT_PLATFORM_CUT = { book: 10 };

const ensureArrayValues = (input, { splitComma = false } = {}) => {
  const result = [];

  const addValue = (value) => {
    if (value === null || value === undefined) return;
    const str = `${value}`.trim();
    if (!str) return;
    result.push(str);
  };

  const visit = (value) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        visit(JSON.parse(trimmed));
        return;
      } catch {
        if (splitComma && trimmed.includes(",")) {
          trimmed.split(",").forEach((part) => addValue(part));
          return;
        }
      }
      addValue(trimmed);
      return;
    }
    addValue(value);
  };

  visit(input);
  return Array.from(new Set(result));
};

const serializeJsonArray = (value, { allowNull = false, splitComma = false } = {}) => {
  if (value === undefined) {
    return allowNull ? undefined : JSON.stringify([]);
  }
  if (value === null) {
    return allowNull ? null : JSON.stringify([]);
  }
  const array = ensureArrayValues(value, { splitComma });
  return JSON.stringify(array);
};

const parseJsonArray = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const normalizeBookRow = (row) => {
  if (!row) return row;
  const normalized = { ...row };

  if (Object.prototype.hasOwnProperty.call(normalized, "included_plans")) {
    normalized.included_plans = parseJsonArray(normalized.included_plans);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "preview_pages")) {
    normalized.preview_pages =
      normalized.preview_pages === null
        ? null
        : parseJsonArray(normalized.preview_pages);
  }

  if (
    Object.prototype.hasOwnProperty.call(normalized, "price") &&
    normalized.price !== undefined &&
    normalized.price !== null
  ) {
    const priceNumber = Number(normalized.price);
    normalized.price = Number.isNaN(priceNumber)
      ? normalized.price
      : priceNumber;
  }

  if (
    Object.prototype.hasOwnProperty.call(normalized, "rating") &&
    normalized.rating !== undefined &&
    normalized.rating !== null
  ) {
    const ratingNumber = Number(normalized.rating);
    normalized.rating = Number.isNaN(ratingNumber)
      ? normalized.rating
      : ratingNumber;
  }

  return normalized;
};

exports.createBook = async (data) => {
  const insertData = { ...data };
  insertData.included_plans = serializeJsonArray(insertData.included_plans, {
    splitComma: true,
  });

  if (Object.prototype.hasOwnProperty.call(insertData, "preview_pages")) {
    const serializedPreviews = serializeJsonArray(insertData.preview_pages, {
      allowNull: true,
    });
    if (serializedPreviews === undefined) {
      delete insertData.preview_pages;
    } else {
      insertData.preview_pages = serializedPreviews;
    }
  }

  const [row] = await db("books").insert(insertData).returning("*");
  return normalizeBookRow(row);
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

  const query = db("books as b")
    .select("b.*", "c.name as category_name")
    .leftJoin("categories as c", "b.category_id", "c.id");

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
    case "price":
      query.orderBy("b.price", "asc");
      break;
    case "rating":
      query.orderByRaw("b.rating DESC NULLS LAST");
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
  const normalizedBooks = books.map(normalizeBookRow);

  return {
    data: normalizedBooks,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
};

exports.getBookById = async (id) => {
  const row = await db("books").where({ id }).first();
  return row ? normalizeBookRow(row) : row;
};

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
  if (updateData.included_plans !== undefined) {
    updateData.included_plans = serializeJsonArray(
      updateData.included_plans,
      { splitComma: true }
    );
  } else {
    delete updateData.included_plans;
  }
  if (updateData.preview_pages !== undefined) {
    const serializedPreviews = serializeJsonArray(updateData.preview_pages, {
      allowNull: true,
    });
    if (serializedPreviews === undefined) {
      delete updateData.preview_pages;
    } else {
      updateData.preview_pages = serializedPreviews;
    }
  }
  const [row] = await db("books").where({ id }).update(updateData).returning("*");
  return row ? normalizeBookRow(row) : row;
};

exports.updateBookStatus = async (id, status) => {
  const [row] = await db("books").where({ id }).update({ status }).returning("*");
  return row ? normalizeBookRow(row) : row;
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
  const bankMethod = await paymentMethodsService.getByType("bank");
  if (!bankMethod)
    throw new AppError("Bank payment method not configured", 400);

  const activeSubscription = await getActiveStudentSubscription(studentId);
  const activePlanId = activeSubscription?.plan_id || null;
  const activeSubscriptionId = activeSubscription?.subscription_id || null;

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

    const booksRaw = await trx('books')
      .whereIn('id', bookIds)
      .where('status', 'active')
      .select('id', 'price', 'included_plans', 'instructor_id', 'tenant_id');
    const books = booksRaw.map(normalizeBookRow);

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

    const planLookupKey = activePlanId ? String(activePlanId) : null;
    const payments = [];
    for (const b of books) {
      const bookItemId =
        b?.id === undefined || b?.id === null ? b.id : String(b.id);
      const includedPlansRaw = Array.isArray(b.included_plans)
        ? b.included_plans
        : parseJsonArray(b.included_plans, []);
      const includedPlans = includedPlansRaw.map((plan) => String(plan));
      const coveredBySubscription =
        Boolean(planLookupKey) && includedPlans.includes(planLookupKey);

      if (coveredBySubscription && activeSubscriptionId) {
        const usage = await trx("plan_usage_metrics")
          .where({
            plan_id: activePlanId,
            subscription_id: activeSubscriptionId,
            item_type: 'book',
            item_id: bookItemId,
          })
          .first();
        if (usage) {
          await trx("plan_usage_metrics")
            .where({
              plan_id: activePlanId,
              subscription_id: activeSubscriptionId,
              item_type: 'book',
              item_id: bookItemId,
            })
            .update({ usage_count: usage.usage_count + 1 });
        } else {
          await trx("plan_usage_metrics").insert({
            plan_id: activePlanId,
            subscription_id: activeSubscriptionId,
            item_type: 'book',
            item_id: bookItemId,
            usage_count: 1,
          });
        }

        const amount = await planRevenue.calculateInstructorAmount(
          activePlanId,
          b.id,
          trx,
          'book',
          activeSubscriptionId
        );
        if (amount > 0 && b.instructor_id) {
          await walletService.increment(
            b.instructor_id,
            amount,
            trx,
            b?.tenant_id,
          );
        }

        const [payment] = await trx('payments')
          .insert({
            id: uuidv4(),
            user_id: studentId,
            item_type: 'book',
            item_id: bookItemId,
            amount: 0,
            status: PAYMENT_STATUS.PAID,
            source: 'subscription',
            tenant_id: b.tenant_id,
          })
          .returning('*');

        await trx('book_purchases').insert({
          student_id: studentId,
          book_id: b.id,
          price_paid: 0,
        });

        payments.push(payment);
        continue;
      } else if (coveredBySubscription) {
        const [payment] = await trx('payments')
          .insert({
            id: uuidv4(),
            user_id: studentId,
            item_type: 'book',
            item_id: bookItemId,
            amount: 0,
            status: PAYMENT_STATUS.PAID,
            source: 'subscription',
            tenant_id: b.tenant_id,
          })
          .returning('*');

        await trx('book_purchases').insert({
          student_id: studentId,
          book_id: b.id,
          price_paid: 0,
        });

        await creditInstructorSubscription(
          'book',
          bookItemId,
          activePlanId,
          trx
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
        tenant_id: b.tenant_id,
        method_id: bankMethod.id,
        item_type: 'book',
        item_id: bookItemId,
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

exports.getWishlist = async (studentId) => {
  const rows = await db('book_wishlist as w')
    .join('books as b', 'w.book_id', 'b.id')
    .where('w.student_id', studentId)
    .select('b.*')
    .orderBy('w.created_at', 'desc');

  return rows.map(normalizeBookRow);
};
