const db = require("../../../config/database");

exports.getByAssignment = async (assignment_id) => {
  return db("assignment_submissions")
    .where({ assignment_id })
    .orderBy("created_at", "asc");
};

exports.createSubmission = async (data) => {
  const [row] = await db("assignment_submissions").insert(data).returning("*");
  return row;
};

exports.getSubmissionById = async (id) => {
  return db("assignment_submissions").where({ id }).first();
};

exports.updateSubmission = async (id, data = {}) => {
  const payload = {
    ...data,
    updated_at: db.fn.now(),
  };
  const [row] = await db("assignment_submissions")
    .where({ id })
    .update(payload)
    .returning("*");
  return row;
};

exports.deleteSubmission = async (id) => {
  return db("assignment_submissions").where({ id }).del();
};

exports.getSubmissionForUser = async (assignment_id, user_id) => {
  return db("assignment_submissions")
    .where({ assignment_id, user_id })
    .first();
};
