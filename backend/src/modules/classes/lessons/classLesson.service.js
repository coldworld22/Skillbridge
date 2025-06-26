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
