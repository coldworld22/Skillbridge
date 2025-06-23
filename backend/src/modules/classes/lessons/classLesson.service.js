const db = require("../../../config/database");

exports.getByClass = async (class_id) => {
  return db("class_lessons").where({ class_id }).orderBy("order", "asc");
};
