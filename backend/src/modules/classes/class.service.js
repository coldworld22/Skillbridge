const db = require("../../config/database");
const ClassModel = require("./class.model");
const { parsePagination } = require("../../utils/pagination");
const AppError = require("../../utils/AppError");

exports.createClass = async (data) => {
  const normalizedAccessType =
    typeof data?.access_type === "string" && ["paid", "free"].includes(data.access_type)
      ? data.access_type
      : "paid";

  const payload = {
    ...data,
    access_type: normalizedAccessType,
  };

  return ClassModel.create(payload);
};

exports.countPublishedClasses = async (instructorId) => {
  const row = await db("online_classes")
    .where({ instructor_id: instructorId, status: "published" })
    .count("id as count")
    .first();
  return parseInt(row.count, 10) || 0;
};

exports.getAllClasses = async (
  { page = 1, limit = 10, filter, approval, status, schedule } = {}
) => {
  const { page: pg, limit: lim, offset } = parsePagination({ page, limit });
  const scheduleCaseSql = `
    CASE
      WHEN c.start_date IS NOT NULL AND c.start_date > NOW() THEN 'Upcoming'
      WHEN c.start_date IS NOT NULL AND c.end_date IS NOT NULL AND NOW() BETWEEN c.start_date AND c.end_date THEN 'Ongoing'
      WHEN c.end_date IS NOT NULL AND NOW() > c.end_date THEN 'Completed'
      ELSE 'Upcoming'
    END
  `;
  const scheduleNormalized =
    typeof schedule === "string" && schedule.trim()
      ? schedule.trim().toLowerCase()
      : null;

  const countQuery = db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id");
  if (filter) {
    countQuery.where(function () {
      this.whereILike("c.title", `%${filter}%`).orWhereILike(
        "u.full_name",
        `%${filter}%`
      );
    });
  }
  if (approval) countQuery.where("c.moderation_status", approval);
  if (status) countQuery.where("c.status", status);
  if (scheduleNormalized)
    countQuery.whereRaw(`LOWER(${scheduleCaseSql}) = ?`, [scheduleNormalized]);
  const totalRow = await countQuery.countDistinct("c.id as count").first();
  const total = parseInt(totalRow.count, 10) || 0;

  const query = db("online_classes as c")
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
      "c.access_type",
      "c.status",
      "c.moderation_status",
      "c.included_plans",
      "c.instructor_id",
      "c.created_at",
      "u.full_name as instructor",
      "cat.name as category",
      db.raw(`${scheduleCaseSql} as schedule_status`),
      db.raw(`
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
            FROM class_tag_map AS m
            LEFT JOIN class_tags AS t ON t.id = m.tag_id
            WHERE m.class_id = c.id AND t.id IS NOT NULL
          ),
          '[]'::json
        ) AS tags
      `)
    );

  if (filter) {
    query.where(function () {
      this.whereILike("c.title", `%${filter}%`).orWhereILike(
        "u.full_name",
        `%${filter}%`
      );
    });
  }
  if (approval) query.where("c.moderation_status", approval);
  if (status) query.where("c.status", status);
  if (scheduleNormalized)
    query.whereRaw(`LOWER(${scheduleCaseSql}) = ?`, [scheduleNormalized]);

  const classes = await query
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
    .select(
      "c.*",
      "u.full_name as instructor",
      "u.avatar_url as instructor_image",
      "cat.name as category",
      db.raw(`
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
            FROM class_tag_map AS m
            LEFT JOIN class_tags AS t ON t.id = m.tag_id
            WHERE m.class_id = c.id AND t.id IS NOT NULL
          ),
          '[]'::json
        ) AS tags
      `)
    )
    .where("c.id", id)
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
      "c.created_at",
      "cat.name as category",
      db.raw(`
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
            FROM class_tag_map AS m
            LEFT JOIN class_tags AS t ON t.id = m.tag_id
            WHERE m.class_id = c.id AND t.id IS NOT NULL
          ),
          '[]'::json
        ) AS tags
      `)
    )
    .where("c.instructor_id", instructorId)
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

exports.bulkDeleteClasses = async (ids) => {
  return db.transaction(async (trx) => {
    const classes = await trx("online_classes")
      .select("id", "title", "instructor_id")
      .whereIn("id", ids);

    const foundIds = new Set(classes.map((cls) => cls.id));
    const missingIds = ids.filter((id) => !foundIds.has(id));

    if (missingIds.length) {
      throw new AppError(
        `Classes not found: ${missingIds.join(", ")}`,
        404
      );
    }

    await trx("online_classes").whereIn("id", ids).del();

    return classes;
  });
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

  const rows = await db("online_classes as c")
    .leftJoin(subquery.as("e"), "e.class_id", "c.id")
    .where({ "c.status": "published", "c.moderation_status": "Approved" })
    .select(
      "c.*",
      db.raw("COALESCE(e.recent_enrollments, 0) as recent_enrollments")
    )
    .orderBy("c.created_at", "desc")
    .limit(lim)
    .offset(offset);

  const classes = rows.map((cls) => ({
    ...cls,
    recent_enrollments: parseInt(cls.recent_enrollments, 10) || 0,
    trending: (parseInt(cls.recent_enrollments, 10) || 0) >= 5,
  }));

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

  const paymentRows = await db("payments")
    .where({ item_type: "class", item_id: classId, status: "paid" })
    .select("source")
    .countDistinct({ student_count: "user_id" })
    .sum({ revenue: "amount" })
    .groupBy("source");

  let totalRevenue = 0;
  let totalPaidStudents = 0;

  const directBreakdown = { count: 0, revenue: 0 };
  const subscriptionBreakdown = { count: 0, revenue: 0 };

  const subscriptionSources = new Set([
    "subscription",
    "plan",
    "plan_subscription",
  ]);

  for (const row of paymentRows) {
    const source = (row.source || "direct").toLowerCase();
    const students = parseInt(row.student_count, 10) || 0;
    const revenue = Number(row.revenue) || 0;

    totalPaidStudents += students;
    totalRevenue += revenue;

    if (subscriptionSources.has(source)) {
      subscriptionBreakdown.count += students;
      subscriptionBreakdown.revenue += revenue;
    } else {
      directBreakdown.count += students;
      directBreakdown.revenue += revenue;
    }
  }

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
  const freeStudents = Math.max(0, totalStudents - totalPaidStudents);

  return {
    totalStudents,
    totalRevenue,
    totalAttendance: parseInt(attendanceRow.count, 10) || 0,
    completed: parseInt(completedRow.count, 10) || 0,
    revenueBreakdown: {
      full: {
        count: directBreakdown.count,
        revenue: directBreakdown.revenue,
      },
      subscription: {
        count: subscriptionBreakdown.count,
        revenue: subscriptionBreakdown.revenue,
      },
      free: {
        count: freeStudents,
        revenue: 0,
      },
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
