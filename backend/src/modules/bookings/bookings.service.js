const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("bookings").insert(data).returning("*");
  return row;
};

exports.getAll = async () => {
  return db("bookings")
    .leftJoin("users as s", "bookings.student_id", "s.id")
    .leftJoin("users as i", "bookings.instructor_id", "i.id")
    .select(
      "bookings.*",
      "s.full_name as student_name",
      "s.avatar_url as student_avatar_url",
      "i.full_name as instructor_name",
      "i.avatar_url as instructor_avatar_url"
    )
    .orderBy("bookings.requested_at", "desc");
};

// Get bookings for a specific student
exports.getByStudent = async (studentId) => {
  return db("bookings")
    .leftJoin("users as i", "bookings.instructor_id", "i.id")
    .where({ student_id: studentId })
    .select(
      "bookings.*",
      "i.full_name as instructor_name",
      "i.avatar_url as instructor_avatar_url"
    )
    .orderBy("bookings.requested_at", "desc");
};

// Get bookings for a specific instructor
exports.getByInstructor = async (instructorId) => {
  return db("bookings")
    .leftJoin("users as s", "bookings.student_id", "s.id")
    .where({ instructor_id: instructorId })
    .select(
      "bookings.*",
      "s.full_name as student_name",
      "s.avatar_url as student_avatar_url"
    )
    .orderBy("bookings.requested_at", "desc");
};

exports.getById = async (id) => {
  return db("bookings")
    .leftJoin("users as s", "bookings.student_id", "s.id")
    .leftJoin("users as i", "bookings.instructor_id", "i.id")
    .select(
      "bookings.*",
      "s.full_name as student_name",
      "s.avatar_url as student_avatar_url",
      "i.full_name as instructor_name",
      "i.avatar_url as instructor_avatar_url"
    )
    .where("bookings.id", id)
    .first();
};

exports.update = async (id, data) => {
  const [row] = await db("bookings").where({ id }).update(data).returning("*");
  return row;
};

exports.delete = async (id) => {
  return db("bookings").where({ id }).del();
};
