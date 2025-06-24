const db = require("../../config/database");

exports.createClass = async (data) => {
  const [created] = await db("online_classes").insert(data).returning("*");
  return created;
};

exports.getAllClasses = async () => {
  const classes = await db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .select(
      "c.id",
      "c.title",
      "c.slug",
      "c.cover_image",
      "c.start_date",
      "c.end_date",
      "c.price",
      "c.status",
      "c.moderation_status",
      "u.full_name as instructor",
      "cat.name as category"
    )
    .orderBy("c.created_at", "desc");
  for (const cls of classes) {
    cls.tags = await exports.getClassTags(cls.id);
  }
  return classes;
};

exports.getClassById = async (id) => {
  const cls = await db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .select(
      "c.*",
      "u.full_name as instructor",
      "cat.name as category"
    )
    .where("c.id", id)
    .first();
  if (cls) {
    cls.tags = await exports.getClassTags(id);
  }
  return cls;
};

exports.getClassesByInstructor = async (instructorId) => {
  const classes = await db("online_classes as c")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .select(
      "c.id",
      "c.title",
      "c.slug",
      "c.cover_image",
      "c.start_date",
      "c.end_date",
      "c.price",
      "c.max_students",
      "c.status",
      "c.moderation_status",
      "cat.name as category"
    )
    .where("c.instructor_id", instructorId)
    .orderBy("c.created_at", "desc");
  for (const cls of classes) {
    cls.tags = await exports.getClassTags(cls.id);
  }
  return classes;
};

exports.updateClass = async (id, data) => {
  const [updated] = await db("online_classes").where({ id }).update(data).returning("*");
  return updated;
};

exports.deleteClass = async (id) => {
  return db("online_classes").where({ id }).del();
};

exports.togglePublishStatus = async (id) => {
  const cls = await db("online_classes").where({ id }).first();
  const newStatus = cls.status === "published" ? "draft" : "published";
  const [updated] = await db("online_classes")
    .where({ id })
    .update({ status: newStatus, moderation_status: newStatus === "published" ? "Pending" : cls.moderation_status })
    .returning("*");
  return updated;
};

exports.updateModeration = async (id, status, reason = null) => {
  const updateData = { moderation_status: status, rejection_reason: reason };
  if (status === "Approved") {
    updateData.status = "published";
  }
  if (status === "Rejected") {
    updateData.status = "draft";
  }
  const [updated] = await db("online_classes")
    .where({ id })
    .update(updateData)
    .returning("*");
  return updated;
};

exports.getPublishedClasses = async () => {
  const subquery = db("class_enrollments")
    .whereRaw("enrolled_at >= NOW() - interval '7 days'")
    .groupBy("class_id")
    .select("class_id")
    .count("* as recent_enrollments");

  const classes = await db("online_classes as c")
    .leftJoin(subquery.as("e"), "e.class_id", "c.id")
    .where({ "c.status": "published", "c.moderation_status": "Approved" })
    .select(
      "c.*",
      db.raw("COALESCE(e.recent_enrollments, 0) as recent_enrollments")
    )
    .orderBy("c.created_at", "desc");

  return classes.map((cls) => ({
    ...cls,
    recent_enrollments: parseInt(cls.recent_enrollments, 10) || 0,
    trending: (parseInt(cls.recent_enrollments, 10) || 0) >= 5,
  }));
};

exports.getPublicClassDetails = async (id) => {
  const cls = await db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .select(
      "c.*",
      "u.full_name as instructor",
      "u.avatar_url as instructor_image",
      "cat.name as category",
      db.raw(
        "(SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as enrolled_count"
      )
    )
    .where({ "c.id": id, "c.status": "published", "c.moderation_status": "Approved" })
    .first();

  if (cls) {
    cls.tags = await exports.getClassTags(id);
    const enrolled = parseInt(cls.enrolled_count, 10) || 0;
    cls.enrolled_count = enrolled;
    cls.spots_left =
      typeof cls.max_students === "number" && cls.max_students !== null
        ? Math.max(0, cls.max_students - enrolled)
        : null;
  }
  return cls;
};

exports.getClassAnalytics = async (classId) => {
  const [totalRow] = await db("class_enrollments")
    .where({ class_id: classId })
    .count();
  const [completedRow] = await db("class_enrollments")
    .where({ class_id: classId, status: "completed" })
    .count();

  const trendRows = await db("class_enrollments")
    .where({ class_id: classId })
    .select(db.raw("DATE(enrolled_at) as date"))
    .count("* as students")
    .groupByRaw("DATE(enrolled_at)")
    .orderBy("date");

  return {
    totalStudents: parseInt(totalRow.count, 10) || 0,
    totalRevenue: 0,
    totalAttendance: 0,
    completed: parseInt(completedRow.count, 10) || 0,
    revenueBreakdown: { full: 0, installments: 0, free: 0 },
    locations: [],
    devices: [],
    registrationTrend: trendRows.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
      students: parseInt(r.students, 10),
    })),
  };
};

exports.addClassTags = async (classId, tagIds) => {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ class_id: classId, tag_id }));
  await db("class_tag_map").insert(rows);
};

exports.getClassTags = async (classId) => {
  return db("class_tag_map as m")
    .join("class_tags as t", "m.tag_id", "t.id")
    .where("m.class_id", classId)
    .select("t.id", "t.name", "t.slug");
};
