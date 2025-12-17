const db = require("../../../config/database");

exports.getByClass = async (class_id) => {
  return db("class_lessons").where({ class_id }).orderBy("order", "asc");
};

exports.createLesson = async (data) => {
  const [row] = await db("class_lessons").insert(data).returning("*");
  return row;
};

exports.getById = async (id) => {
  return db("class_lessons").where({ id }).first();
};

exports.updateLesson = async (id, data) => {
  const [row] = await db("class_lessons").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteLesson = async (id) => {
  return db("class_lessons").where({ id }).del();
};

// Find lessons starting between a time window, including class and instructor details
exports.getLessonsStartingBetween = async (start, end) => {
  return db("class_lessons as l")
    .join("online_classes as c", "l.class_id", "c.id")
    .select(
      "l.id",
      "l.class_id",
      "l.title",
      "l.start_time",
      "c.title as class_title",
      "c.instructor_id"
    )
    .whereBetween("l.start_time", [start, end]);
};
