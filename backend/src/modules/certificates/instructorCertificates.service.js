const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/AppError");
const templateConfig = require("../certificateTemplates/certificateTemplateConfig.service");
const {
  generateCode,
} = require("../users/tutorials/certificate/certificate.service");

const DEFAULT_PLATFORM_NAME =
  process.env.APP_NAME ||
  process.env.NEXT_PUBLIC_APP_NAME ||
  "SkillBridge";

const normalizeText = (value) => {
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const buildVerificationUrl = (code) => {
  const base =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_BASE ||
    process.env.NEXT_PUBLIC_WEB_BASE_URL ||
    null;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/certificate/verify/${code}`;
};

const formatCertificate = (row) => {
  if (!row) return null;
  const rawIssueDate = row.issue_date || row.created_at;
  const issueDate =
    rawIssueDate instanceof Date
      ? rawIssueDate.toISOString()
      : rawIssueDate || new Date().toISOString();
  const certificateCode = row.certificate_code;
  const template = row.template || row.template_config || null;

  return {
    id: row.id,
    classId: row.class_id,
    studentId: row.user_id,
    studentName: row.recipient_name_override || row.student_name || "Student",
    courseTitle: row.class_title || "Course",
    issueDate,
    status: row.status,
    certificateCode,
    grade: row.grade,
    platformName: row.platform_name_override || DEFAULT_PLATFORM_NAME,
    instructorName:
      row.instructor_name_override || row.instructor_name || "Instructor",
    verificationUrl:
      row.verification_url || buildVerificationUrl(certificateCode),
    template,
  };
};

const ensureClassOwnership = async (classId, instructorId) => {
  const cls = await db("online_classes").where({ id: classId }).first();
  if (!cls) {
    throw new AppError("Class not found", 404);
  }
  if (cls.instructor_id !== instructorId) {
    throw new AppError("You do not have access to this class", 403);
  }
  return cls;
};

const ensureStudentEnrollment = async (classId, studentId) => {
  const enrollment = await db("class_enrollments")
    .where({ class_id: classId, user_id: studentId })
    .whereNot({ status: "cancelled" })
    .first();
  if (!enrollment) {
    throw new AppError("Student is not enrolled in this class", 400);
  }
  return enrollment;
};

const baseSelectFields = [
  "c.id",
  "c.user_id",
  "c.class_id",
  "c.template_id",
  "c.status",
  "c.certificate_code",
  "c.grade",
  "c.verification_url",
  "c.recipient_name_override",
  "c.instructor_name_override",
  "c.platform_name_override",
  "c.created_at",
  "c.updated_at",
  "student.full_name as student_name",
  "cls.title as class_title",
  "instructor.full_name as instructor_name",
];

const buildListQuery = (instructorId) => {
  return db("certificates as c")
    .leftJoin("online_classes as cls", "cls.id", "c.class_id")
    .leftJoin("users as student", "student.id", "c.user_id")
    .leftJoin("users as instructor", "instructor.id", "cls.instructor_id")
    .where("cls.instructor_id", instructorId)
    .whereNotNull("c.class_id");
};

const listForInstructor = async (instructorId, filters = {}) => {
  const query = buildListQuery(instructorId).select(baseSelectFields);

  if (filters.status) {
    query.andWhere("c.status", filters.status);
  }

  if (filters.q) {
    const term = `%${filters.q}%`;
    query.andWhere((builder) =>
      builder
        .where("student.full_name", "ilike", term)
        .orWhere("cls.title", "ilike", term)
        .orWhere("c.certificate_code", "ilike", term),
    );
  }

  const rows = await query.orderBy("c.created_at", "desc");
  return rows.map(formatCertificate);
};

const getForInstructor = async (id, instructorId) => {
  const row = await buildListQuery(instructorId)
    .select(baseSelectFields)
    .where("c.id", id)
    .first();

  if (!row) {
    throw new AppError("Certificate not found", 404);
  }

  let template = null;
  if (row.template_id) {
    template = await db("certificate_templates")
      .where({ id: row.template_id })
      .first();
  }

  return formatCertificate({
    ...row,
    template,
  });
};

const issueForInstructor = async (instructorId, payload) => {
  const {
    classId,
    studentId,
    studentName,
    issueDate,
    templateId,
    platformName,
    instructorName,
    grade,
    verificationUrl,
  } = payload;

  await ensureClassOwnership(classId, instructorId);
  await ensureStudentEnrollment(classId, studentId);

  const existing = await db("certificates")
    .where({ class_id: classId, user_id: studentId })
    .first();
  if (existing && existing.status !== "revoked") {
    return existing;
  }

  let resolvedTemplateId = templateId;
  if (!resolvedTemplateId) {
    resolvedTemplateId = await templateConfig.resolveTemplateIdForContext(
      "online_class",
    );
  }

  const code = generateCode().replace("TUT", "CLS");
  const issuedAt = issueDate ? new Date(issueDate) : new Date();

  const [row] = await db("certificates")
    .insert({
      id: uuidv4(),
      user_id: studentId,
      class_id: classId,
      template_id: resolvedTemplateId,
      certificate_code: code,
      status: "issued",
      grade: normalizeText(grade),
      verification_url: normalizeText(verificationUrl),
      recipient_name_override: normalizeText(studentName),
      instructor_name_override: normalizeText(instructorName),
      platform_name_override: normalizeText(platformName),
      created_at: issuedAt,
      updated_at: issuedAt,
    })
    .returning("*");

  return row;
};

const revokeForInstructor = async (id, instructorId) => {
  await getForInstructor(id, instructorId);
  const [row] = await db("certificates")
    .where({ id })
    .update({
      status: "revoked",
      revoked_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning("*");
  return row;
};

module.exports = {
  listForInstructor,
  getForInstructor,
  issueForInstructor,
  revokeForInstructor,
};
