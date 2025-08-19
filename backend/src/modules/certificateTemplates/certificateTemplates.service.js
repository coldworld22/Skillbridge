const db = require("../../config/database");

exports.getAll = async () => {
  return db("certificate_templates").select("*").orderBy("created_at", "desc");
};

exports.getById = async (id) => {
  return db("certificate_templates").where({ id }).first();
};

exports.create = async (data) => {
  const [row] = await db("certificate_templates").insert(data).returning("*");
  return row;
};

exports.update = async (id, data) => {
  const [row] = await db("certificate_templates").where({ id }).update(data).returning("*");
  return row;
};

exports.remove = async (id) => {
  return db("certificate_templates").where({ id }).del();
};

exports.toggleStatus = async (id) => {
  const [row] = await db("certificate_templates")
    .where({ id })
    .update({ active: db.raw("NOT active") })
    .returning("*");
  return row || null;
};
