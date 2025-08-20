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
  const [row] = await db("certificate_templates")
    .where({ id })
    .update({ active: db.raw("NOT active") })
    .returning("*");
  return row || null;
};

exports.duplicate = async (id) => {
  const template = await exports.getById(id);
  if (!template) return null;
  const newTemplate = { ...template };
  delete newTemplate.id;
  delete newTemplate.created_at;
  delete newTemplate.updated_at;
  newTemplate.active = false;
  newTemplate.created_at = db.fn.now();
  newTemplate.updated_at = db.fn.now();
  newTemplate.name = `Copy of ${template.name}`;
  const [row] = await db("certificate_templates").insert(newTemplate).returning("*");
  return row;
};
