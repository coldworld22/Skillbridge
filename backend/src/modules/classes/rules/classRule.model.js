const db = require("../../../config/database");

exports.create = async ({ class_id, text }) => {
  const [row] = await db("class_rules")
    .insert({ class_id, text })
    .returning("*");
  return row;
};

exports.findByClass = (class_id) => {
  return db("class_rules")
    .where({ class_id })
    .select("*")
    .orderBy("created_at", "asc");
};

exports.update = async (id, data) => {
  const [row] = await db("class_rules")
    .where({ id })
    .update(data)
    .returning("*");
  return row;
};

exports.remove = (id) => {
  return db("class_rules").where({ id }).del();
};
