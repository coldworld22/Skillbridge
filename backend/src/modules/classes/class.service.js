const db = require("../../config/database");

exports.createClass = async (data) => {
  const [created] = await db("online_classes").insert(data).returning("*");
  return created;
};

exports.getAllClasses = async () => {
  return db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .select(
      "c.id",
      "c.title",
      "c.slug",
      "c.start_date",
      "c.end_date",
      "c.status",
      "u.full_name as instructor",
      "cat.name as category"
    )
    .orderBy("c.created_at", "desc");
};

exports.getClassById = async (id) => {
  return db("online_classes as c")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .select(
      "c.*",
      "u.full_name as instructor",
      "cat.name as category"
    )
    .where("c.id", id)
    .first();
};

exports.updateClass = async (id, data) => {
  const [updated] = await db("online_classes").where({ id }).update(data).returning("*");
  return updated;
};

exports.deleteClass = async (id) => {
  return db("online_classes").where({ id }).del();
};

exports.getPublishedClasses = async () => {
  return db("online_classes")
    .where({ status: "published" })
    .orderBy("created_at", "desc");
};

exports.getPublicClassDetails = async (id) => {
  return db("online_classes")
    .where({ id, status: "published" })
    .first();
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
