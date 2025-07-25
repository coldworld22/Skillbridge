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

exports.getAllAssignments = async () => {
  return db("class_assignments as a")
    .leftJoin("online_classes as c", "a.class_id", "c.id")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .select(
      "a.id",
      "a.title",
      "a.description",
      "a.due_date",
      "a.class_id",
      "c.title as class_title",
      "u.full_name as instructor"
    )
    .orderBy("a.created_at", "desc");
};
