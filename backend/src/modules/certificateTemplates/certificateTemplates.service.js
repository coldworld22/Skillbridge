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

const buildFallbackPreview = (template) => {
  const now = new Date();
  const safeId = template?.id ? template.id : `preview-${now.getTime()}`;
  const baseCourseName = template?.name ? `${template.name} Course` : "Sample Course";
  const safePlatform = process.env.APP_NAME || "SkillBridge";

  return {
    id: safeId,
    studentName: "Sample Student",
    courseName: baseCourseName,
    issueDate: now.toISOString(),
    instructor: "Sample Instructor",
    platformName: safePlatform,
    grade: "A+",
    certificateCode: `PREVIEW-${String(safeId).slice(0, 8).toUpperCase()}`,
  };
};

exports.getPreview = async (id) => {
  const template = await exports.getById(id);
  if (!template) return null;

  const certificate = await db("certificates as c")
    .leftJoin("users as student", "c.user_id", "student.id")
    .leftJoin("tutorials as tut", "c.tutorial_id", "tut.id")
    .leftJoin("online_classes as cls", "c.class_id", "cls.id")
    .leftJoin("users as tut_instructor", "tut.instructor_id", "tut_instructor.id")
    .leftJoin("users as cls_instructor", "cls.instructor_id", "cls_instructor.id")
    .select(
      "c.id as certificate_id",
      "c.certificate_code",
      "c.created_at",
      "student.full_name as student_name",
      "tut.title as tutorial_title",
      "cls.title as class_title",
      "tut_instructor.full_name as tutorial_instructor_name",
      "cls_instructor.full_name as class_instructor_name"
    )
    .where("c.template_id", id)
    .orderBy("c.created_at", "desc")
    .first();

  if (!certificate) {
    return buildFallbackPreview(template);
  }

  const issueDate = certificate.created_at instanceof Date
    ? certificate.created_at.toISOString()
    : new Date(certificate.created_at || Date.now()).toISOString();

  const platformName = process.env.APP_NAME || "SkillBridge";

  return {
    id: certificate.certificate_id,
    studentName: certificate.student_name || "Sample Student",
    courseName:
      certificate.tutorial_title ||
      certificate.class_title ||
      (template.name ? `${template.name} Course` : "Sample Course"),
    issueDate,
    instructor:
      certificate.tutorial_instructor_name ||
      certificate.class_instructor_name ||
      "Sample Instructor",
    platformName,
    grade: "A+",
    certificateCode:
      certificate.certificate_code ||
      `PREVIEW-${String(certificate.certificate_id).slice(0, 8).toUpperCase()}`,
  };
};
