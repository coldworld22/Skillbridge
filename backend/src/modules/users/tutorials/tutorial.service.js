// 📁 src/modules/users/tutorials/tutorial.service.js
const db = require("../../../config/database");

exports.createTutorial = async (data) => {
  const [tutorial] = await db("tutorials").insert(data).returning("*");
  return tutorial;
};

exports.getAllTutorials = async () => {
  return db("tutorials")
    .leftJoin("categories", "tutorials.category_id", "categories.id")
    .leftJoin("users", "tutorials.instructor_id", "users.id")
    .whereNot("tutorials.status", "archived")
    .orderBy("tutorials.created_at", "desc")
    .select(
      "tutorials.*",
      "categories.name as category_name",
      "categories.image_url as category_image_url",
      "users.full_name as instructor_name"
    );
};

exports.getTutorialById = async (id) => {
  return db({ t: 'tutorials' })
    .leftJoin('categories as c', 't.category_id', 'c.id')
    .leftJoin('users as u', 't.instructor_id', 'u.id')
    .leftJoin(
      db('tutorial_reviews')
        .select('tutorial_id')
        .avg({ avg_rating: 'rating' })
        .groupBy('tutorial_id')
        .as('r'),
      'r.tutorial_id',
      't.id'
    )
    .leftJoin(
      db('tutorial_comments')
        .select('tutorial_id')
        .count({ comment_count: 'id' })
        .groupBy('tutorial_id')
        .as('com'),
      'com.tutorial_id',
      't.id'
    )
    .leftJoin(
      db('tutorial_enrollments')
        .select('tutorial_id')
        .countDistinct({ enrollments: 'user_id' })
        .groupBy('tutorial_id')
        .as('en'),
      'en.tutorial_id',
      't.id'
    )
    .leftJoin(
      db('tutorial_views')
        .select('tutorial_id')
        .count({ views: 'id' })
        .groupBy('tutorial_id')
        .as('v'),
      'v.tutorial_id',
      't.id'
    )
    .where('t.id', id)
    .first(
      't.*',
      'c.name as category_name',
      'c.image_url as category_image_url',
      'u.full_name as instructor_name',
      db.raw('COALESCE(r.avg_rating,0) as rating'),
      db.raw('COALESCE(com.comment_count,0) as comment_count'),
      db.raw('COALESCE(en.enrollments,0) as enrollments'),
      db.raw('COALESCE(v.views,0) as views')
    );
};

exports.getTutorialsByInstructor = async (instructorId) => {
  const tutorials = await db("tutorials as t")
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
    )
    .leftJoin(
      db("tutorial_views")
        .select("tutorial_id")
        .count({ views: "id" })
        .groupBy("tutorial_id")
        .as("v"),
      "v.tutorial_id",
      "t.id"
    )
    .select(
      "t.*",
      "c.name as category_name",
      "c.image_url as category_image_url",
      "u.full_name as instructor_name",
      db.raw("COALESCE(r.avg_rating, 0) as rating"),
      db.raw("COALESCE(com.comment_count, 0) as comment_count"),
      db.raw("COALESCE(en.enrollments, 0) as enrollments"),
      db.raw("COALESCE(v.views, 0) as views")
    )
    .where("t.instructor_id", instructorId)
    .whereNot("t.status", "archived")
    .orderBy("t.created_at", "desc");

  for (const tut of tutorials) {
    tut.tags = await exports.getTutorialTags(tut.id);
  }

  return tutorials;
};

exports.updateTutorial = async (id, data) => {
  const [updated] = await db("tutorials").where({ id }).update(data).returning("*");
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
  const newStatus = tutorial.status === "published" ? "draft" : "published";
  return db("tutorials").where({ id }).update({ status: newStatus });
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

  return db({ t: "tutorials" })
    .leftJoin("users as u", "t.instructor_id", "u.id")
    .leftJoin(ratingSubquery.as("r"), "r.tutorial_id", "t.id")
    .where({ "t.status": "published", "t.moderation_status": "Approved" })
    .select(
      "t.*",
      "u.full_name as instructor_name",
      "u.avatar_url as instructor_avatar",
      db.raw("COALESCE(r.avg_rating, 0) as rating")
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

exports.addTutorialTags = async (tutorialId, tagIds) => {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ tutorial_id: tutorialId, tag_id }));
  await db("tutorial_tag_map").insert(rows);
};

exports.getTutorialTags = async (tutorialId) => {
  return db("tutorial_tag_map as m")
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
    .where({ tutorial_id: tutorialId, status: 'completed' })
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
