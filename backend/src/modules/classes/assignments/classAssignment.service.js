const db = require("../../../config/database");

exports.getByClass = async (class_id) => {
  return db("class_assignments").where({ class_id }).orderBy("created_at", "asc");
};

exports.createAssignment = async (data) => {
  const [row] = await db("class_assignments").insert(data).returning("*");
  return row;
};

exports.updateAssignment = async (id, data) => {
  const [row] = await db("class_assignments").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteAssignment = async (id) => {
  return db("class_assignments").where({ id }).del();
};
