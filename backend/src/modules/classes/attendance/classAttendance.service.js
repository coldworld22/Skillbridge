const db = require("../../../config/database");
const { v4: uuidv4 } = require("uuid");

// Get attendance list for a class (per current lesson id = classId for now)
exports.getByClass = async (class_id) => {
  return db("class_enrollments as ce")
    .join("users as u", "ce.user_id", "u.id")
    .leftJoin("class_attendance as ca", function () {
      this.on("ca.lesson_id", "=", "ce.class_id").andOn("ca.user_id", "=", "u.id");
    })
    .where("ce.class_id", class_id)
    .select("u.id as user_id", "u.full_name", "ca.attended");
};

// Upsert attendance record
exports.setAttendance = async (class_id, user_id, attended) => {
  const existing = await db("class_attendance")
    .where({ lesson_id: class_id, user_id })
    .first();

  if (existing) {
    const [row] = await db("class_attendance")
      .where({ lesson_id: class_id, user_id })
      .update({ attended, timestamp: db.fn.now() })
      .returning("*");
    return row;
  }

  const [row] = await db("class_attendance")
    .insert({ id: uuidv4(), lesson_id: class_id, user_id, attended })
    .returning("*");
  return row;
};
