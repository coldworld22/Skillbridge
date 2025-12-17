const db = require("../../../config/database");
const { v4: uuidv4 } = require("uuid");

// Get attendance list for a lesson
exports.getByClass = async (lesson_id) => {
  return db("class_lessons as cl")
    .join("class_enrollments as ce", "ce.class_id", "cl.class_id")
    .join("users as u", "ce.user_id", "u.id")
    .leftJoin("class_attendance as ca", function () {
      this.on("ca.lesson_id", "=", "cl.id").andOn("ca.user_id", "=", "u.id");
    })
    .where("cl.id", lesson_id)
    .select("u.id as user_id", "u.full_name", "ca.attended");
};

// Upsert attendance record for a lesson
exports.setAttendance = async (lesson_id, user_id, attended) => {
  const lesson = await db("class_lessons").where({ id: lesson_id }).first();
  if (!lesson) throw new Error("Lesson not found");
  const class_id = lesson.class_id;

  const existing = await db("class_attendance")
    .where({ lesson_id, user_id })
    .first();

  if (existing) {
    const [row] = await db("class_attendance")
      .where({ lesson_id, user_id })
      .update({ attended, timestamp: db.fn.now(), class_id })
      .returning("*");
    return row;
  }

  const [row] = await db("class_attendance")
    .insert({ id: uuidv4(), lesson_id, class_id, user_id, attended })
    .returning("*");
  return row;
};
