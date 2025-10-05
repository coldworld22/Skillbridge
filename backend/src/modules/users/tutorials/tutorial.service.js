// 📁 src/modules/users/tutorials/tutorial.service.js
const db = require("../../../config/database");
const tagService = require("./tutorialTag.service");
const chapterService = require("./chapters/tutorialChapter.service");
const { withTransaction } = require("../../../services/transaction.service");
const cache = require("../../../utils/cache");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");
const { TUTORIAL_STATUS } = require("../../../../shared/tutorialStatus");

const isUniqueSlugError = (error) => {
  if (!error || error.code !== "23505") return false;
  const constraint = String(error.constraint || "").toLowerCase();
  if (constraint.includes("slug")) return true;
  const detail = String(error.detail || "").toLowerCase();
  if (detail.includes("(slug)") || detail.includes("slug")) return true;
  const message = String(error.message || "").toLowerCase();
  return message.includes("slug");
};

exports.createTutorial = async (data, trx = db) => {
  const insertData = { included_plans: [], ...data };
  if (!insertData.included_plans) insertData.included_plans = [];

  const fallbackSlug = slugify(insertData.title || uuidv4(), {
    lower: true,
    strict: true,
  });
  const baseSlug = (insertData.slug || "").trim() || fallbackSlug || uuidv4();

  let attempt = 0;
  while (attempt < 50) {
    const slugCandidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    try {
      const [tutorial] = await trx("tutorials")
        .insert({ ...insertData, slug: slugCandidate })
        .returning("*");
      return tutorial;
    } catch (error) {
      if (!isUniqueSlugError(error)) throw error;
      attempt += 1;
    }
  }

  throw new Error("Unable to generate a unique slug for tutorial");
};

exports.createTutorialWithRelations = async (
  tutorialData,
  tags = [],
  chapters = []
) => {
  return withTransaction(async (trx) => {
    const tutorial = await exports.createTutorial(tutorialData, trx);

    const normalizedTagNames = Array.from(
      new Set(
        (tags || [])
          .map((tag) =>
            typeof tag === "string" ? tag.trim() : tag?.name?.trim?.() ?? ""
          )
          .filter(Boolean)
      )
    );

    const tagIds = [];
    for (const name of normalizedTagNames) {
      const existing = await tagService.findByName(name, trx);
      const tag =
        existing ||
        (await tagService.createTag(
          { name, slug: slugify(name, { lower: true, strict: true }) },
          trx
        ));
      tagIds.push(tag.id);
    }

    if (tagIds.length) {
      await exports.addTutorialTags(tutorial.id, tagIds, trx);
    }

    if (Array.isArray(chapters) && chapters.length) {
      for (let index = 0; index < chapters.length; index += 1) {
        const chapter = chapters[index];
        if (!chapter || !chapter.title) continue;

        const chapterData = {
          id: chapter.id || uuidv4(),
          tutorial_id: tutorial.id,
          title: chapter.title,
          video_url: chapter.video_url || null,
          duration: chapter.duration ?? null,
          order: chapter.order ?? index + 1,
          is_preview: chapter.is_preview ?? false,
        };

        await chapterService.create(chapterData, trx);
      }
    }

    const [createdChapters, tutorialTags] = await Promise.all([
      trx("tutorial_chapters")
        .where({ tutorial_id: tutorial.id })
        .orderBy("order"),
      tagIds.length ? exports.getTutorialTags(tutorial.id, trx) : Promise.resolve([]),
    ]);

    return {
      ...tutorial,
      chapters: createdChapters,
      tags: tutorialTags,
    };
  });
};

exports.findByTitle = async (title) => {
  return db("tutorials")
    .whereRaw('LOWER(title) = ?', title.toLowerCase())
    .first();
};

exports.countPublishedTutorials = async (instructorId) => {
  const row = await db("tutorials")
    .where({ instructor_id: instructorId, status: TUTORIAL_STATUS.PUBLISHED })
    .count("id as count")
    .first();
  return parseInt(row.count, 10) || 0;
};

/**
 * Fetches heavy aggregate metrics for a tutorial while caching the results.
 * This helps avoid repeating expensive COUNT queries on frequently accessed
 * tutorials.
 */
exports.getTutorialAggregates = async (tutorialId) => {
  const cached = cache.get(`tutorial:${tutorialId}:aggregates`);
  if (cached) return cached;

  const [viewRow, enrollmentRow, commentRow, ratingRow] = await Promise.all([
    db('tutorial_views').where({ tutorial_id: tutorialId }).count().first(),
    db('tutorial_enrollments')
      .where({ tutorial_id: tutorialId })
      .countDistinct({ count: 'user_id' })
      .first(),
    db('tutorial_comments').where({ tutorial_id: tutorialId }).count().first(),
    db('tutorial_reviews').where({ tutorial_id: tutorialId }).avg({ rating: 'rating' }).first()
  ]);

  const aggregates = {
    views: parseInt(viewRow.count, 10) || 0,
    enrollments: parseInt(enrollmentRow.count, 10) || 0,
    comment_count: parseInt(commentRow.count, 10) || 0,
    rating: parseFloat(ratingRow.rating) || 0
  };

  cache.set(`tutorial:${tutorialId}:aggregates`, aggregates);
  return aggregates;
};

const { parsePagination } = require("../../../utils/pagination");

exports.getAllTutorials = async (filters = {}) => {
  const { status, category, search, approval } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const baseQuery = db("tutorials as t")
    .leftJoin("categories as c", "t.category_id", "c.id")
    .leftJoin("users as u", "t.instructor_id", "u.id")
    .whereNot("t.status", TUTORIAL_STATUS.ARCHIVED)
    .modify((query) => {
      if (status) query.andWhere("t.status", status);
      if (category) query.andWhere("t.category_id", category);
      if (approval) {
        query.andWhere(function () {
          if (approval === "Pending") {
            this.where("t.moderation_status", approval).orWhereNull(
              "t.moderation_status"
            );
          } else {
            this.where("t.moderation_status", approval);
          }
        });
      }
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
  const query = db({ t: 'tutorials' })
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .leftJoin('users as u', 't.instructor_id', 'u.id');

  if (userId) {
    query.leftJoin('tutorial_enrollments as te', function () {
      this.on('te.tutorial_id', 't.id').andOn('te.user_id', '=', userId);
    });
  }

  query.where('t.id', id);

  const columns = [
    't.*',
    'c.name as category_name',
    'c.image_url as category_image_url',
    'u.full_name as instructor_name',
  ];

  if (userId) {
    columns.push(
      db.raw(
        'CASE WHEN te.user_id IS NULL THEN false ELSE true END as is_enrolled'
      )
    );
  } else {
    columns.push(db.raw('false as is_enrolled'));
  }

  const tutorial = await query.select(columns).first();
  if (!tutorial) return null;

  const aggregates = await exports.getTutorialAggregates(id);
  return { ...tutorial, ...aggregates };
};

exports.getTutorialsByInstructor = async (instructorId) => {
  const ratingSubquery = db('tutorial_reviews')
    .select('tutorial_id')
    .avg({ avg_rating: 'rating' })
    .groupBy('tutorial_id');

  const commentCountSubquery = db('tutorial_comments')
    .select('tutorial_id')
    .count({ comment_count: 'id' })
    .groupBy('tutorial_id');

  const enrollmentCountSubquery = db('tutorial_enrollments')
    .select('tutorial_id')
    .countDistinct({ enrollments: 'user_id' })
    .groupBy('tutorial_id');

  const viewCountSubquery = db('tutorial_views')
    .select('tutorial_id')
    .count({ views: 'id' })
    .groupBy('tutorial_id');

  const tutorials = await db('tutorials as t')
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .leftJoin('users as u', 't.instructor_id', 'u.id')
    .leftJoin(ratingSubquery.as('r'), 'r.tutorial_id', 't.id')
    .leftJoin(commentCountSubquery.as('com'), 'com.tutorial_id', 't.id')
    .leftJoin(enrollmentCountSubquery.as('en'), 'en.tutorial_id', 't.id')
    .leftJoin(viewCountSubquery.as('v'), 'v.tutorial_id', 't.id')
    .where('t.instructor_id', instructorId)
    .whereNot('t.status', TUTORIAL_STATUS.ARCHIVED)
    .orderBy('t.created_at', 'desc')
    .select(
      't.*',
      'c.name as category_name',
      'c.image_url as category_image_url',
      'u.full_name as instructor_name',
      db.raw('COALESCE(r.avg_rating, 0) as rating'),
      db.raw('COALESCE(com.comment_count, 0) as comment_count'),
      db.raw('COALESCE(en.enrollments, 0) as enrollments'),
      db.raw('COALESCE(v.views, 0) as views')
    );

  for (const tut of tutorials) {
    const [aggregates, tags] = await Promise.all([
      exports.getTutorialAggregates(tut.id),
      exports.getTutorialTags(tut.id),
    ]);
    Object.assign(tut, aggregates);
    tut.tags = tags;
  }

  return tutorials;
};

exports.updateTutorial = async (id, data) => {
  const updateData = { ...data };
  if (updateData.included_plans === undefined) {
    delete updateData.included_plans;
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

  const newStatus =
    tutorial.status === TUTORIAL_STATUS.PUBLISHED
      ? TUTORIAL_STATUS.DRAFT
      : TUTORIAL_STATUS.PUBLISHED;
  const updateData = { status: newStatus };

  if (newStatus === TUTORIAL_STATUS.PUBLISHED) {
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
    .where({ status: TUTORIAL_STATUS.ARCHIVED })
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
    .where({ "t.status": TUTORIAL_STATUS.PUBLISHED, "t.moderation_status": "Approved" })
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
    .where({ "t.status": TUTORIAL_STATUS.PUBLISHED, "t.moderation_status": "Approved" })
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
      status: TUTORIAL_STATUS.PUBLISHED,
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
    .where({ "t.id": id, "t.status": TUTORIAL_STATUS.PUBLISHED, "t.moderation_status": "Approved" })
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
  return withTransaction(async (trx) => {
    await exports.updateTutorialTags(tutorialId, tags, trx);
    return exports.getTutorialTags(tutorialId, trx);
  });
};

exports.getTutorialTags = async (tutorialId, trx = db) => {
  return trx("tutorial_tag_map as m")
    .join("tags as t", "m.tag_id", "t.id")
    .where("m.tutorial_id", tutorialId)
    .select("t.id", "t.name", "t.slug");
};

exports.recordTutorialView = async (tutorialId, viewerId, ip, userAgent) => {
  return db('tutorial_views').insert({
    tutorial_id: tutorialId,
    viewer_id: viewerId || null,
    ip_address: ip,
    user_agent: userAgent,
  });
};

exports.getTutorialViewCount = async (tutorialId) => {
  const [row] = await db('tutorial_views').where({ tutorial_id: tutorialId }).count();
  return parseInt(row.count, 10) || 0;
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
  const [viewRow] = await db('tutorial_views')
    .where({ tutorial_id: tutorialId })
    .count();
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
    views: parseInt(viewRow.count, 10) || 0,
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
