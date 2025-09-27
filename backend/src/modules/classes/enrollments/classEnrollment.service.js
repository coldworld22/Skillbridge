const db = require("../../../config/database");

// Helper to use either the provided transaction or the default knex instance
const useDb = (trx) => trx || db;

exports.findEnrollment = async (user_id, class_id, trx = null) => {
  const query = useDb(trx)("class_enrollments").where({ user_id, class_id });
  if (trx && trx.isTransaction) query.forUpdate();
  return query.first();
};

exports.createEnrollment = async (data, trx = null) => {
  const [row] = await useDb(trx)("class_enrollments").insert(data).returning("*");
  return row;
};

exports.updateEnrollment = async (user_id, class_id, data, trx = null) => {
  return useDb(trx)("class_enrollments").where({ user_id, class_id }).update(data);
};

exports.countEnrollments = async (class_id, trx = null) => {
  const query = useDb(trx)("class_enrollments")
    .where({ class_id })
    .whereNot({ status: "cancelled" });
  if (trx && trx.isTransaction) query.forUpdate();
  const rows = await query.select("id");
  return rows.length;
};

exports.markCompleted = async (user_id, class_id) => {
  return db("class_enrollments")
    .where({ user_id, class_id })
    .update({ status: "completed" });
};

exports.getByUser = async (user_id) => {
  return db("class_enrollments")
    .join("online_classes", "online_classes.id", "class_enrollments.class_id")
    .leftJoin("users as u", "online_classes.instructor_id", "u.id")
    .where("class_enrollments.user_id", user_id)
    .select(
      "online_classes.*",
      "class_enrollments.status",
      "class_enrollments.enrolled_at",
      "u.full_name as instructor"
    );
};

// List all students enrolled in a class
exports.getByClass = async (class_id) => {
  return db("class_enrollments as ce")
    .join("users as u", "ce.user_id", "u.id")
    .where("ce.class_id", class_id)
    .select(
      "u.id",
      "u.full_name",
      "u.email",
      "u.phone",
      "ce.status",
      "ce.enrolled_at"
    )
    .orderBy("ce.enrolled_at");
};

// Get phone numbers of students enrolled in a class
exports.getPhonesByClass = async (class_id) => {
  return db("class_enrollments as ce")
    .join("users as u", "ce.user_id", "u.id")
    .where("ce.class_id", class_id)
    .whereNotNull("u.phone")
    .select("u.id", "u.phone");
};

// Get a single student's enrollment details in a class
exports.getStudent = async (class_id, user_id) => {
  const enrollment = await db("class_enrollments as ce")
    .join("users as u", "ce.user_id", "u.id")
    .where({ "ce.class_id": class_id, "ce.user_id": user_id })
    .select(
      "u.id",
      "u.full_name",
      "u.email",
      "u.phone",
      "ce.status",
      "ce.enrolled_at"
    )
    .first();

  if (!enrollment) {
    return null;
  }

  const [lessonRows, attendanceRows, scoreRow] = await Promise.all([
    db("class_lessons")
      .where({ class_id })
      .orderBy("order", "asc")
      .select("id", "title", "order"),
    db("class_attendance as ca")
      .leftJoin("class_lessons as cl", "ca.lesson_id", "cl.id")
      .where({ "ca.class_id": class_id, "ca.user_id": user_id })
      .select(
        "ca.id",
        "ca.lesson_id",
        "ca.attended",
        "ca.timestamp",
        "cl.title as lesson_title"
      )
      .orderBy("ca.timestamp", "asc"),
    db("student_class_scores as scs")
      .leftJoin("certificates as c", function () {
        this.on("c.class_id", "=", "scs.class_id").andOn(
          "c.user_id",
          "=",
          "scs.student_id"
        );
      })
      .where({ "scs.class_id": class_id, "scs.student_id": user_id })
      .select(
        "scs.assignment_score",
        "scs.attendance_score",
        "scs.final_exam_score",
        "scs.total_score",
        "scs.passed",
        "scs.certificate_issued",
        "scs.issued_at",
        "c.id as certificate_id"
      )
      .first(),
  ]);

  const lessons = Array.isArray(lessonRows)
    ? lessonRows.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
      }))
    : [];

  const attendance = Array.isArray(attendanceRows)
    ? attendanceRows.map((record) => ({
        id: record.id,
        lessonId: record.lesson_id,
        lessonTitle: record.lesson_title,
        attended: Boolean(record.attended),
        timestamp: record.timestamp,
      }))
    : [];

  const certificate = scoreRow
    ? {
        issued:
          Boolean(scoreRow.certificate_issued) || Boolean(scoreRow.certificate_id),
        issuedAt: scoreRow.issued_at,
        certificateId: scoreRow.certificate_id,
        passed: Boolean(scoreRow.passed),
        totalScore: scoreRow.total_score,
        assignmentScore: scoreRow.assignment_score,
        attendanceScore: scoreRow.attendance_score,
        finalExamScore: scoreRow.final_exam_score,
      }
    : null;

  return {
    id: enrollment.id,
    full_name: enrollment.full_name,
    name: enrollment.full_name,
    email: enrollment.email,
    phone: enrollment.phone,
    status: enrollment.status,
    enrolled_at: enrollment.enrolled_at,
    lessons,
    attendance,
    notes: [],
    certificate,
    certificateIssued: certificate?.issued ?? false,
  };
};
