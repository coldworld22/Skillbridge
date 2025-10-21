const db = require("../../config/database");
const ClassModel = require("./class.model");
const { parsePagination } = require("../../utils/pagination");

exports.createClass = async (data) => {
  return ClassModel.create(data);
};

exports.countPublishedClasses = async (instructorId) => {
  const row = await db("online_classes")
    .where({ instructor_id: instructorId, status: "published" })
    .count("id as count")
    .first();
  return parseInt(row.count, 10) || 0;
};

exports.getAllClasses = async ({ page = 1, limit = 10 } = {}) => {
  const { page: pg, limit: lim, offset } = parsePagination({ page, limit });
  const totalRow = await db("online_classes").count("id as count").first();
  const total = parseInt(totalRow.count, 10) || 0;

  const classes = await db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .leftJoin("class_tag_map as m", "c.id", "m.class_id")
    .leftJoin("class_tags as t", "m.tag_id", "t.id")
    .select(
      "c.id",
      "c.title",
      "c.slug",
      "c.cover_image",
      "c.start_date",
      "c.end_date",
      "c.price",
      "c.access_type",
      "c.status",
      "c.moderation_status",
      "c.included_plans",
      "c.instructor_id",
      "u.full_name as instructor",
      "cat.name as category",
      db.raw(
        "COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)) FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags"
      )
    )
    .groupBy(
      "c.id",
      "c.title",
      "c.slug",
      "c.cover_image",
      "c.start_date",
      "c.end_date",
      "c.price",
      "c.access_type",
      "c.status",
      "c.moderation_status",
      "c.included_plans",
      "c.instructor_id",
      "u.full_name",
      "cat.name"
    )
    .orderBy("c.created_at", "desc")
    .limit(lim)
    .offset(offset);

  return {
    data: classes,
    meta: {
      page: pg,
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim),
    },
  };
};

exports.getClassById = async (id) => {
  const cls = await db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .leftJoin("class_tag_map as m", "c.id", "m.class_id")
    .leftJoin("class_tags as t", "m.tag_id", "t.id")
    .select(
      "c.*",
      "u.full_name as instructor",
      "u.avatar_url as instructor_image",
      "cat.name as category",
      db.raw(
        "COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)) FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags"
      )
    )
    .where("c.id", id)
    .groupBy("c.id", "u.full_name", "u.avatar_url", "cat.name")
    .first();
  if (cls) {
    cls.views = await exports.getClassViewCount(id);
  }
  return cls;
};

exports.getClassesByInstructor = async (instructorId, { page = 1, limit = 10 } = {}) => {
  const { page: pg, limit: lim, offset } = parsePagination({ page, limit });
  const totalRow = await db("online_classes")
    .where({ instructor_id: instructorId })
    .count("id as count")
    .first();
  const total = parseInt(totalRow.count, 10) || 0;

  const classes = await db("online_classes as c")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .leftJoin("class_tag_map as m", "c.id", "m.class_id")
    .leftJoin("class_tags as t", "m.tag_id", "t.id")
    .select(
      "c.id",
      "c.title",
      "c.slug",
      "c.cover_image",
      "c.start_date",
      "c.end_date",
      "c.price",
      "c.max_students",
      "c.access_type",
      "c.status",
      "c.moderation_status",
      "c.included_plans",
      "cat.name as category",
      db.raw(
        "COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)) FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags"
      )
    )
    .where("c.instructor_id", instructorId)
    .groupBy(
      "c.id",
      "c.title",
      "c.slug",
      "c.cover_image",
      "c.start_date",
      "c.end_date",
      "c.price",
      "c.max_students",
      "c.access_type",
      "c.status",
      "c.moderation_status",
      "c.included_plans",
      "cat.name"
    )
    .orderBy("c.created_at", "desc")
    .limit(lim)
    .offset(offset);

  return {
    data: classes,
    meta: {
      page: pg,
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim),
    },
  };
};

exports.updateClass = async (id, data) => {
  return ClassModel.update(id, data);
};

exports.deleteClass = async (id) => {
  return ClassModel.remove(id);
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

exports.getPublishedClasses = async ({ page = 1, limit = 10 } = {}) => {
  const { page: pg, limit: lim, offset } = parsePagination({ page, limit });

  const totalRow = await db("online_classes")
    .where({ status: "published", moderation_status: "Approved" })
    .count("id as count")
    .first();
  const total = parseInt(totalRow.count, 10) || 0;

  const subquery = db("class_enrollments")
    .whereRaw("enrolled_at >= NOW() - interval '7 days'")
    .groupBy("class_id")
    .select("class_id")
    .count("* as recent_enrollments");

  const totalEnrollments = db("class_enrollments")
    .whereNot({ status: "cancelled" })
    .groupBy("class_id")
    .select("class_id")
    .count("* as enrolled_count");

  const rows = await db("online_classes as c")
    .leftJoin(subquery.as("e"), "e.class_id", "c.id")
    .leftJoin(totalEnrollments.as("total"), "total.class_id", "c.id")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .where({ "c.status": "published", "c.moderation_status": "Approved" })
    .select(
      "c.*",
      "u.full_name as instructor",
      "u.avatar_url as instructor_image",
      "cat.name as category",
      db.raw("COALESCE(e.recent_enrollments, 0) as recent_enrollments"),
      db.raw("COALESCE(total.enrolled_count, 0) as enrolled_count")
    )
    .orderByRaw("COALESCE(e.recent_enrollments, 0) DESC")
    .orderBy("c.start_date", "asc")
    .orderBy("c.created_at", "desc")
    .limit(lim)
    .offset(offset);

  const classes = rows.map((cls) => {
    const recent = parseInt(cls.recent_enrollments, 10) || 0;
    const enrolledCount = parseInt(cls.enrolled_count, 10) || 0;
    const rawMax =
      cls.max_students === null || cls.max_students === undefined
        ? null
        : Number(cls.max_students);
    const maxStudents = Number.isFinite(rawMax) ? rawMax : null;
    const spotsLeft =
      maxStudents === null ? null : Math.max(0, maxStudents - enrolledCount);

    return {
      ...cls,
      price:
        cls.price === null ||
        cls.price === undefined ||
        cls.price === ""
          ? null
          : parseFloat(cls.price),
      max_students: maxStudents ?? cls.max_students,
      recent_enrollments: recent,
      enrolled_count: enrolledCount,
      trending: recent >= 5,
      spots_left: spotsLeft,
    };
  });

  return {
    data: classes,
    meta: {
      page: pg,
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim),
    },
  };
};

exports.getPublicClassDetails = async (id) => {
  const cls = await db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("instructor_profiles as p", "u.id", "p.user_id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .select(
      "c.*",
      "u.full_name as instructor",
      "u.avatar_url as instructor_image",
      "p.experience as instructor_bio",
      "cat.name as category",
      db.raw(
        "(SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as enrolled_count"
      )
    )
    .where({ "c.id": id, "c.status": "published", "c.moderation_status": "Approved" })
    .first();

  if (cls) {
    cls.tags = await exports.getClassTags(id);
    cls.views = await exports.getClassViewCount(id);
    const enrolled = parseInt(cls.enrolled_count, 10) || 0;
    cls.enrolled_count = enrolled;
    cls.spots_left =
      typeof cls.max_students === "number" && cls.max_students !== null
        ? Math.max(0, cls.max_students - enrolled)
        : null;
  }
  return cls;
};

exports.getClassesStartingBetween = async (startTime, endTime) => {
  return db("online_classes")
    .select("id", "title", "start_date")
    .whereBetween("start_date", [startTime, endTime]);
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

  const [revenueRow] = await db("payments")
    .where({ item_type: "class", item_id: classId, status: "paid" })
    .sum({ revenue: "amount" });

  const [paidStudentsRow] = await db("payments")
    .where({ item_type: "class", item_id: classId, status: "paid" })
    .countDistinct({ count: "user_id" });

  const [attendanceRow] = await db("class_attendance")
    .where({ class_id: classId, attended: true })
    .countDistinct({ count: "user_id" });

  const viewAgents = await db("class_views")
    .where({ class_id: classId })
    .pluck("user_agent");

  const deviceCounts = {};
  for (const ua of viewAgents) {
    const agent = ua || "";
    let type = "Desktop";
    if (/mobile/i.test(agent)) type = "Mobile";
    else if (/tablet|ipad/i.test(agent)) type = "Tablet";
    deviceCounts[type] = (deviceCounts[type] || 0) + 1;
  }

  const totalStudents = parseInt(totalRow.count, 10) || 0;
  const paidStudents = parseInt(paidStudentsRow.count, 10) || 0;

  return {
    totalStudents,
    totalRevenue: parseFloat(revenueRow.revenue) || 0,
    totalAttendance: parseInt(attendanceRow.count, 10) || 0,
    completed: parseInt(completedRow.count, 10) || 0,
    revenueBreakdown: {
      full: paidStudents,
      installments: 0,
      free: Math.max(0, totalStudents - paidStudents),
    },
    locations: [],
    devices: Object.entries(deviceCounts).map(([name, value]) => ({ name, value })),
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

exports.recordClassView = async (classId, viewerId, ip, userAgent) => {
  return db('class_views').insert({
    class_id: classId,
    viewer_id: viewerId || null,
    ip_address: ip,
    user_agent: userAgent,
  });
};

exports.getClassViewCount = async (classId) => {
  const [row] = await db('class_views').where({ class_id: classId }).count();
  return parseInt(row.count, 10) || 0;
};
