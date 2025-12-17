const db = require("../../../../config/database");

exports.getMySubmission = async (assignment_id, user_id) => {
  return db("tutorial_assignment_submissions")
    .where({ assignment_id, user_id })
    .first();
};

exports.createSubmission = async (data) => {
  const [row] = await db("tutorial_assignment_submissions")
    .insert(data)
    .returning("*");
  return row;
};

exports.updateSubmission = async (id, data = {}) => {
  const payload = {
    ...data,
    updated_at: db.fn.now(),
  };
  const [row] = await db("tutorial_assignment_submissions")
    .where({ id })
    .update(payload)
    .returning("*");
  return row;
};

exports.getSubmissionById = async (id) => {
  return db("tutorial_assignment_submissions").where({ id }).first();
};
