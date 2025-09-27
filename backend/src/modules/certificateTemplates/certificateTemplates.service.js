const db = require("../../config/database");

const getAll = async () => {
  return db("certificate_templates").select("*").orderBy("created_at", "desc");
};

const getById = async (id) => {
  if (!id) return null;
  return db("certificate_templates").where({ id }).first();
};

const getDefaultTemplate = async () => {
  const activeTemplate = await db("certificate_templates")
    .where({ active: true })
    .orderBy("updated_at", "desc")
    .first();

  if (activeTemplate) {
    return activeTemplate;
  }

  return db("certificate_templates")
    .orderBy("updated_at", "desc")
    .first();
};

const resolveTemplateId = async (templateId) => {
  const provided = await getById(templateId);
  if (provided) {
    return provided.id;
  }

  const fallback = await getDefaultTemplate();
  return fallback ? fallback.id : null;
};

const create = async (data) => {
  const [row] = await db("certificate_templates").insert(data).returning("*");
  return row;
};

const update = async (id, data) => {
  const rows = await db("certificate_templates")
    .where({ id })
    .update(data)
    .returning("*");
  if (!rows.length) return null;
  return rows[0];
};

const remove = async (id) => {
  const deleted = await db("certificate_templates").where({ id }).del();
  return deleted;
};

const toggleStatus = async (id) => {
  const [row] = await db("certificate_templates")
    .where({ id })
    .update({ active: db.raw("NOT active") })
    .returning("*");
  return row || null;
};

const duplicate = async (id) => {
  const template = await getById(id);
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

module.exports = {
  getAll,
  getById,
  getDefaultTemplate,
  resolveTemplateId,
  create,
  update,
  remove,
  toggleStatus,
  duplicate,
};
