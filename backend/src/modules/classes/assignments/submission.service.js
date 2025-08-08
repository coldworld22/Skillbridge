const db = require("../../../config/database");

exports.getByAssignment = async (assignment_id) => {
  return db("assignment_submissions")
    .where({ assignment_id })
    .orderBy("created_at", "asc");
};

exports.createSubmission = async (data) => {
  const [row] = await db("assignment_submissions")
    .insert(data)
    .returning("*");
  return row;
};

exports.updateSubmission = async (id, data) => {
  const [row] = await db("assignment_submissions")
    .where({ id })
    .update(data)
    .returning("*");
  return row;
};

exports.deleteSubmission = async (id) => {
  return db("assignment_submissions").where({ id }).del();
};
