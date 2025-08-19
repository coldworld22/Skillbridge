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
  const rows = await db("certificate_templates")
    .where({ id })
    .update(data)
    .returning("*");
  if (!rows.length) return null;
  return rows[0];
};

exports.remove = async (id) => {
  const deleted = await db("certificate_templates").where({ id }).del();
  return deleted;
};

exports.toggleStatus = async (id) => {
  const template = await exports.getById(id);
  if (!template) return null;
  const [row] = await db("certificate_templates")
    .where({ id })
    .update({ active: !template.active })
    .returning("*");
  return row;
};
