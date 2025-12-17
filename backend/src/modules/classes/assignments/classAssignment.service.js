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
      "a.type",
      "a.allow_late",
      "a.time_to_finish",
      "a.language",
      "a.starter_code",
      "a.questions",
      "a.grading_rubric",
      "a.supporting_resources",
      "a.class_id",
      "c.title as class_title",
      "u.full_name as instructor"
    )
    .orderBy("a.created_at", "desc");
};

exports.getAssignmentWithClass = async (id) => {
  return db("class_assignments as a")
    .leftJoin("online_classes as c", "a.class_id", "c.id")
    .leftJoin("users as u", "c.instructor_id", "u.id")
    .select(
      "a.*",
      "c.title as class_title",
      "c.description as class_description",
      "c.cover_image as class_cover_image",
      "c.instructor_id",
      "u.full_name as instructor_name"
    )
    .where("a.id", id)
    .first();
};
