const db = require("../../../config/database");

exports.getByClass = async (class_id) => {
  return db("class_assignments").where({ class_id }).orderBy("created_at", "asc");
};
