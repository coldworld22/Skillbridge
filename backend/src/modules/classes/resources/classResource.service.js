const db = require("../../../config/database");

exports.listByClass = async (classId) => {
  return db("class_resources")
    .where({ class_id: classId })
    .orderBy("created_at", "desc");
};

exports.create = async (data) => {
  const [row] = await db("class_resources").insert(data).returning("*");
  return row;
};

exports.remove = async (id) => {
  const [row] = await db("class_resources")
    .where({ id })
    .del()
    .returning("*");
  return row;
};

exports.findById = async (id) => {
  return db("class_resources").where({ id }).first();
};
