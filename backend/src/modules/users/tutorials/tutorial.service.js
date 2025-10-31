// 📁 src/modules/users/tutorials/tutorial.service.js
const db = require("../../../config/database");
const logger = require("../../../utils/logger.js");
const tagService = require("./tutorialTag.service");
const chapterService = require("./chapters/tutorialChapter.service");
const { withTransaction } = require("../../../services/transaction.service");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");

const generateUniqueSlug = async (title, trx) => {
  const base = slugify(title || "", { lower: true, strict: true }) || uuidv4();
  let candidate = base;
  let suffix = 1;
  // ensure slug is unique across tutorials
  while (await trx("tutorials").where({ slug: candidate }).first()) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
};

const normalizeIncludedPlans = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((id) => {
      if (id === null || id === undefined) return null;
      const str = `${id}`.trim();
      return str.length ? str : null;
    })
    .filter(Boolean);
};

let hasLoggedMissingViewTable = false;
const isMissingViewTableError = (err) =>
  err?.code === "42P01" ||
  (typeof err?.message === "string" && err.message.includes("tutorial_views"));
const logMissingViewTableOnce = () => {
  if (hasLoggedMissingViewTable) return;
  hasLoggedMissingViewTable = true;
  logger.warn(
    "tutorial_views table not found; skipping tutorial view tracking until the migration runs."
  );
};

exports.createTutorial = async (data, trx = db) => {
  const plans = normalizeIncludedPlans(data.included_plans);
  const insertData = {
    ...data,
    included_plans:
      Array.isArray(plans) && plans.length
        ? JSON.stringify(plans)
        : JSON.stringify([]),
  };
  const [tutorial] = await trx("tutorials").insert(insertData).returning("*");
  tutorial.included_plans = plans;
  return tutorial;
};

exports.createTutorialWithRelations = async (data, tags = [], chapters = []) => {
  return withTransaction(async (trx) => {
    const payload = { ...data };
    payload.slug = await generateUniqueSlug(payload.title, trx);
    if (!payload.id) payload.id = uuidv4();
    const plans = normalizeIncludedPlans(payload.included_plans);
    payload.included_plans = plans;
    payload.allow_installments = false;
    payload.installments = 1;

    const tutorial = await exports.createTutorial(payload, trx);
    tutorial.included_plans = plans;

    if (Array.isArray(tags) && tags.length) {
      await exports.updateTutorialTags(tutorial.id, tags, trx);
      tutorial.tags = await exports.getTutorialTags(tutorial.id, trx);
    } else {
      tutorial.tags = [];
    }

    if (Array.isArray(chapters) && chapters.length) {
      const normalizedChapters = chapters.map((chapter, index) => ({
        id: uuidv4(),
        tutorial_id: tutorial.id,
        title: chapter.title,
        video_url: chapter.video_url || null,
        duration:
          chapter.duration === undefined || chapter.duration === null
            ? null
            : chapter.duration,
        order: chapter.order || index + 1,
        is_preview: Boolean(chapter.is_preview),
      }));

      for (const chapter of normalizedChapters) {
        await chapterService.create(chapter, trx);
      }
      tutorial.chapters = normalizedChapters;
    } else {
      tutorial.chapters = [];
    }

    return tutorial;
  });
};

exports.countPublishedTutorials = async (instructorId) => {
  const row = await db("tutorials")
    .where({ instructor_id: instructorId, status: "published" })
    .count("id as count")
    .first();
  return parseInt(row.count, 10) || 0;
};

const { parsePagination } = require("../../../utils/pagination");

exports.getAllTutorials = async (filters = {}) => {
  const { status, category, search } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const baseQuery = db("tutorials as t")
    .leftJoin("categories as c", "t.category_id", "c.id")
    .leftJoin("users as u", "t.instructor_id", "u.id")
    .whereNot("t.status", "archived")
    .modify((query) => {
      if (status) query.andWhere("t.status", status);
      if (category) query.andWhere("t.category_id", category);
      if (search) {
        query.andWhere(function () {
          this.whereILike("t.title", `%${search}%`);
        });
      }
    });

  const countQuery = baseQuery
    .clone()
    .clearSelect()
    .count("t.id as count")
    .first();

  const dataQuery = baseQuery
    .clone()
    .orderBy("t.created_at", "desc")
    .select(
      "t.*",
      "c.name as category_name",
      "c.image_url as category_image_url",
      "u.full_name as instructor_name"
    )
    .limit(limit)
    .offset(offset);

  const [totalResult, tutorials] = await Promise.all([countQuery, dataQuery]);
  const total = parseInt(totalResult.count, 10) || 0;

  return {
    data: tutorials,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getTutorialById = async (id, userId = null) => {
  const buildQuery = (includeViews = true) => {
    const query = db({ t: "tutorials" })
      .leftJoin("categories as c", "t.category_id", "c.id")
      .leftJoin("users as u", "t.instructor_id", "u.id")
      .leftJoin(
        db("tutorial_reviews")
          .select("tutorial_id")
          .avg({ avg_rating: "rating" })
          .groupBy("tutorial_id")
          .as("r"),
        "r.tutorial_id",
        "t.id"
      )
      .leftJoin(
        db("tutorial_comments")
          .select("tutorial_id")
          .count({ comment_count: "id" })
          .groupBy("tutorial_id")
          .as("com"),
        "com.tutorial_id",
        "t.id"
      )
      .leftJoin(
        db("tutorial_enrollments")
          .select("tutorial_id")
          .countDistinct({ enrollments: "user_id" })
          .groupBy("tutorial_id")
          .as("en"),
        "en.tutorial_id",
        "t.id"
      );

    if (includeViews) {
      query.leftJoin(
        db("tutorial_views")
          .select("tutorial_id")
          .count({ views: "id" })
          .groupBy("tutorial_id")
          .as("v"),
        "v.tutorial_id",
        "t.id"
      );
    }

    if (userId) {
      query.leftJoin("tutorial_enrollments as te", function () {
        this.on("te.tutorial_id", "t.id").andOn("te.user_id", "=", userId);
      });
    }

    query.where("t.id", id);

    const columns = [
      "t.*",
      "c.name as category_name",
      "c.image_url as category_image_url",
      "u.full_name as instructor_name",
      db.raw("COALESCE(r.avg_rating,0) as rating"),
      db.raw("COALESCE(com.comment_count,0) as comment_count"),
      db.raw("COALESCE(en.enrollments,0) as enrollments"),
      includeViews
        ? db.raw("COALESCE(v.views,0) as views")
        : db.raw("0 as views"),
    ];

    if (userId) {
      columns.push(
        db.raw(
          "CASE WHEN te.user_id IS NULL THEN false ELSE true END as is_enrolled"
        )
      );
    } else {
      columns.push(db.raw("false as is_enrolled"));
    }

    return query.select(columns).first();
  };

  try {
    return await buildQuery(true);
  } catch (err) {
    if (isMissingViewTableError(err)) {
      logMissingViewTableOnce();
      return buildQuery(false);
    }
    throw err;
  }
};

exports.getTutorialsByInstructor = async (instructorId) => {
  const runQuery = async (includeViews = true) => {
    const query = db("tutorials as t")
      .leftJoin("categories as c", "t.category_id", "c.id")
      .leftJoin("users as u", "t.instructor_id", "u.id")
      .leftJoin(
        db("tutorial_reviews")
          .select("tutorial_id")
          .avg({ avg_rating: "rating" })
          .groupBy("tutorial_id")
          .as("r"),
        "r.tutorial_id",
        "t.id"
      )
      .leftJoin(
        db("tutorial_comments")
          .select("tutorial_id")
          .count({ comment_count: "id" })
          .groupBy("tutorial_id")
          .as("com"),
        "com.tutorial_id",
        "t.id"
      )
      .leftJoin(
        db("tutorial_enrollments")
          .select("tutorial_id")
          .countDistinct({ enrollments: "user_id" })
          .groupBy("tutorial_id")
          .as("en"),
        "en.tutorial_id",
        "t.id"
      );

    if (includeViews) {
      query.leftJoin(
        db("tutorial_views")
          .select("tutorial_id")
          .count({ views: "id" })
          .groupBy("tutorial_id")
          .as("v"),
        "v.tutorial_id",
        "t.id"
      );
    }

    query
      .select(
        "t.*",
        "c.name as category_name",
        "c.image_url as category_image_url",
        "u.full_name as instructor_name",
        db.raw("COALESCE(r.avg_rating, 0) as rating"),
        db.raw("COALESCE(com.comment_count, 0) as comment_count"),
        db.raw("COALESCE(en.enrollments, 0) as enrollments"),
        includeViews
          ? db.raw("COALESCE(v.views, 0) as views")
          : db.raw("0 as views")
      )
      .where("t.instructor_id", instructorId)
      .whereNot("t.status", "archived")
      .orderBy("t.created_at", "desc");

    const tutorials = await query;

    for (const tut of tutorials) {
      tut.tags = await exports.getTutorialTags(tut.id);
    }

    return tutorials;
  };

  try {
    return await runQuery(true);
  } catch (err) {
    if (isMissingViewTableError(err)) {
      logMissingViewTableOnce();
      return runQuery(false);
    }
    throw err;
  }
};

exports.updateTutorial = async (id, data) => {
  const updateData = { ...data };
  if (updateData.included_plans === undefined) {
    delete updateData.included_plans;
  } else {
    const plans = normalizeIncludedPlans(updateData.included_plans);
    updateData.included_plans =
      Array.isArray(plans) && plans.length
        ? JSON.stringify(plans)
        : JSON.stringify([]);
  }
  const [updated] = await db("tutorials")
    .where({ id })
    .update(updateData)
    .returning("*");
  return updated;
};

exports.updateStatus = async (id, data) => {
  return db("tutorials").where({ id }).update(data);
};

exports.permanentlyDeleteTutorial = async (id) => {
  return db("tutorials").where({ id }).del();
};

exports.togglePublishStatus = async (id) => {
  const tutorial = await db("tutorials").where({ id }).first();
  if (!tutorial) {
    return null;
  }

  const newStatus = tutorial.status === "published" ? "draft" : "published";
  const updateData = { status: newStatus };

  if (newStatus === "published") {
    updateData.moderation_status = "Pending";
    updateData.rejection_reason = null;
  }

  const [updated] = await db("tutorials")
    .where({ id })
    .update(updateData)
    .returning(["status", "moderation_status"]);

  return updated;
};

exports.updateModeration = async (id, status, reason = null) => {
  return db("tutorials").where({ id }).update({
    moderation_status: status,
    rejection_reason: reason
  });
};

exports.bulkUpdateModeration = async (ids, status) => {
  return db("tutorials").whereIn("id", ids).update({
    moderation_status: status
  });
};

exports.getTutorialsByIds = async (ids) => {
  return db('tutorials')
    .select('id', 'title', 'instructor_id')
    .whereIn('id', ids);
};

exports.bulkUpdateStatus = async (ids, status) => {
  return db("tutorials").whereIn("id", ids).update({ status });
};

exports.bulkDeleteTutorials = async (ids) => {
  return db("tutorials").whereIn("id", ids).del();
};

exports.getArchivedTutorials = async () => {
  return db("tutorials")
    .where({ status: "archived" })
    .orderBy("updated_at", "desc");
};

exports.getFeaturedTutorials = async () => {
  const ratingSubquery = db("tutorial_reviews")
    .select("tutorial_id")
    .avg({ avg_rating: "rating" })
    .groupBy("tutorial_id");

  return db({ t: "tutorials" })
    .leftJoin("users as u", "t.instructor_id", "u.id")
    .leftJoin(ratingSubquery.as("r"), "r.tutorial_id", "t.id")
    .where({ "t.status": "published", "t.moderation_status": "Approved" })
    .select(
      "t.*",
      "u.full_name as instructor_name",
      db.raw("COALESCE(r.avg_rating, 0) as rating")
    )
    .orderBy("t.created_at", "desc")
    .limit(6);
};

exports.getPublishedTutorials = async () => {
  const ratingSubquery = db("tutorial_reviews")
    .select("tutorial_id")
    .avg({ avg_rating: "rating" })
    .groupBy("tutorial_id");

  const chapterCountSubquery = db("tutorial_chapters")
    .select("tutorial_id")
    .count({ chapter_count: "id" })
    .groupBy("tutorial_id");

  return db({ t: "tutorials" })
    .leftJoin("users as u", "t.instructor_id", "u.id")
    .leftJoin(ratingSubquery.as("r"), "r.tutorial_id", "t.id")
    .leftJoin(chapterCountSubquery.as("c"), "c.tutorial_id", "t.id")
    .where({ "t.status": "published", "t.moderation_status": "Approved" })
    .select(
      "t.*",
      "u.full_name as instructor_name",
      "u.avatar_url as instructor_avatar",
      db.raw("COALESCE(r.avg_rating, 0) as rating"),
      db.raw("COALESCE(c.chapter_count, 0) as chapter_count")
    )
    .orderBy("t.created_at", "desc");
};

exports.getTutorialsByCategory = async (categoryId) => {
  return db("tutorials")
    .where({
      category_id: categoryId,
      status: "published",
      moderation_status: "Approved",
    })
    .orderBy("created_at", "desc");
};

exports.getPublicTutorialDetails = async (id) => {
  const ratingSubquery = db("tutorial_reviews")
    .select("tutorial_id")
    .avg({ avg_rating: "rating" })
    .groupBy("tutorial_id");

  const tutorial = await db({ t: "tutorials" })
    .leftJoin("users as u", "t.instructor_id", "u.id")
    .leftJoin("instructor_profiles as p", "u.id", "p.user_id")
    .leftJoin(ratingSubquery.as("r"), "r.tutorial_id", "t.id")
    .where({ "t.id": id, "t.status": "published", "t.moderation_status": "Approved" })
    .first(
      "t.*",
      "u.full_name as instructor_name",
      "u.avatar_url as instructor_avatar",
      "p.bio as instructor_bio",
      db.raw("COALESCE(r.avg_rating, 0) as rating")
    );

  if (!tutorial) return null;

  const chapters = await db("tutorial_chapters")
    .where({ tutorial_id: id })
    .orderBy("order");
  const views = await exports.getTutorialViewCount(id);
  return { ...tutorial, chapters, views };
};

exports.addTutorialTags = async (tutorialId, tagIds, trx = db) => {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ tutorial_id: tutorialId, tag_id }));
  await trx("tutorial_tag_map").insert(rows);
};

exports.updateTutorialTags = async (tutorialId, tags, trx = db) => {
  await trx("tutorial_tag_map").where({ tutorial_id: tutorialId }).del();
  if (!tags || !tags.length) return;
  const tagIds = [];
  for (const name of tags) {
    const existing = await tagService.findByName(name, trx);
    const tag =
      existing ||
      (await tagService.createTag(
        { name, slug: slugify(name, { lower: true, strict: true }) },
        trx
      ));
    tagIds.push(tag.id);
  }
  await exports.addTutorialTags(tutorialId, tagIds, trx);
};

exports.updateTutorialTagsTransactional = async (tutorialId, tags) => {
  const trx = await db.transaction();
  try {
    await exports.updateTutorialTags(tutorialId, tags, trx);
    const result = await exports.getTutorialTags(tutorialId, trx);
    await trx.commit();
    return result;
  } catch (err) {
    try {
      await trx.rollback();
    } catch (_) {}
    throw err;
  }
};

exports.getTutorialTags = async (tutorialId, trx = db) => {
  return trx("tutorial_tag_map as m")
    .join("tags as t", "m.tag_id", "t.id")
    .where("m.tutorial_id", tutorialId)
    .select("t.id", "t.name", "t.slug");
};

exports.recordTutorialView = async (tutorialId, viewerId, ip, userAgent) => {
  try {
    await db("tutorial_views").insert({
      tutorial_id: tutorialId,
      viewer_id: viewerId || null,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (err) {
    if (isMissingViewTableError(err)) {
      logMissingViewTableOnce();
      return null;
    }
    logger.error("Failed to record tutorial view", err);
    return null;
  }
};

exports.getTutorialViewCount = async (tutorialId) => {
  try {
    const [row] = await db("tutorial_views")
      .where({ tutorial_id: tutorialId })
      .count();
    return parseInt(row?.count, 10) || 0;
  } catch (err) {
    if (isMissingViewTableError(err)) {
      logMissingViewTableOnce();
      return 0;
    }
    logger.error("Failed to fetch tutorial view count", err);
    return 0;
  }
};
exports.getTutorialAnalytics = async (tutorialId) => {
  const [totalRow] = await db('tutorial_enrollments')
    .where({ tutorial_id: tutorialId })
    .count();
  const [completedRow] = await db('tutorial_enrollments')
    .where({ tutorial_id: tutorialId })
    .where('progress', 100)
    .count();
  const [commentRow] = await db('tutorial_comments')
    .where({ tutorial_id: tutorialId })
    .count();
  const [ratingRow] = await db('tutorial_reviews')
    .where({ tutorial_id: tutorialId })
    .avg({ rating: 'rating' });
  const viewCount = await exports.getTutorialViewCount(tutorialId);
  const trendRows = await db('tutorial_enrollments')
    .where({ tutorial_id: tutorialId })
    .select(db.raw('DATE(enrolled_at) as date'))
    .count('* as students')
    .groupByRaw('DATE(enrolled_at)')
    .orderBy('date');
  const [revenueRow] = await db('payments')
    .where({ item_type: 'tutorial', item_id: tutorialId, status: 'paid' })
    .sum({ revenue: 'amount' });
  return {
    totalStudents: parseInt(totalRow.count, 10) || 0,
    completed: parseInt(completedRow.count, 10) || 0,
    totalRevenue: parseFloat(revenueRow.revenue) || 0,
    views: viewCount,
    commentCount: parseInt(commentRow.count, 10) || 0,
    rating: parseFloat(ratingRow.rating) || 0,
    devices: [],
    locations: [],
    registrationTrend: trendRows.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      students: parseInt(r.students, 10),
    })),
  };
};

exports.getAssignmentCount = async (tutorialId) => {
  const [row] = await db('tutorial_assignments')
    .where({ tutorial_id: tutorialId })
    .count();
  return parseInt(row.count, 10) || 0;
};
