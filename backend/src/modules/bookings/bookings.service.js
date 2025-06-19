const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("bookings").insert(data).returning("*");
  return row;
};

exports.getAll = async () => {
  return db("bookings").select("*").orderBy("requested_at", "desc");
};

// Get bookings for a specific student
exports.getByStudent = async (studentId) => {
  return db("bookings")
    .where({ student_id: studentId })
    .orderBy("requested_at", "desc");
};

// Get bookings for a specific instructor
exports.getByInstructor = async (instructorId) => {
  return db("bookings")
    .where({ instructor_id: instructorId })
    .orderBy("requested_at", "desc");
};

exports.getById = async (id) => {
  return db("bookings").where({ id }).first();
};

exports.update = async (id, data) => {
  const [row] = await db("bookings").where({ id }).update(data).returning("*");
  return row;
};

exports.delete = async (id) => {
  return db("bookings").where({ id }).del();
};
