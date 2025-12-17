/**
 * Certificate admin service
 */
const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const { parsePagination } = require("../../utils/pagination");

const APP_NAME = process.env.APP_NAME || "SkillBridge";
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.APP_URL || "")
  .trim()
  .replace(/\/$/, "");

const STATUS_MAP = {
  issued: "Issued",
  revoked: "Revoked",
  pending: "Pending",
};

const normalizeStatus = (status) => {
  if (!status) return null;
  const value = String(status).trim().toLowerCase();
  return ["issued", "revoked", "pending"].includes(value) ? value : null;
};

const formatStatus = (status) => STATUS_MAP[status] || STATUS_MAP.issued;

const buildVerificationUrl = (code) => {
  if (!code || !FRONTEND_URL) return null;
  return `${FRONTEND_URL}/certificate/verify/${code}`;
};

const baseQuery = () =>
  db("certificates as c")
    .leftJoin("users as student", "student.id", "c.user_id")
    .leftJoin("online_classes as cls", "cls.id", "c.class_id")
    .leftJoin("users as class_instructor", "class_instructor.id", "cls.instructor_id")
    .leftJoin("tutorials as tut", "tut.id", "c.tutorial_id")
    .leftJoin(
      "users as tutorial_instructor",
      "tutorial_instructor.id",
      "tut.instructor_id"
    )
    .leftJoin("certificate_templates as tmpl", "tmpl.id", "c.template_id")
    .leftJoin("student_class_scores as scs", function joinScores() {
      this.on("scs.class_id", "=", "c.class_id").andOn(
        "scs.student_id",
        "=",
        "c.user_id"
      );
    })
    .select(
      "c.id",
      "c.user_id",
      "c.class_id",
      "c.tutorial_id",
      "c.template_id",
      "c.certificate_code",
      "c.status",
      "c.created_at as issued_at",
      "student.full_name as student_name",
      "student.email as student_email",
      "cls.title as class_title",
      "tut.title as tutorial_title",
      "class_instructor.full_name as class_instructor_name",
      "tutorial_instructor.full_name as tutorial_instructor_name",
      db.raw("to_jsonb(tmpl) as template"),
      "scs.total_score as class_total_score"
    );

const formatCertificate = (row) => {
  if (!row) return null;

  const status = formatStatus(row.status);
  const instructorName =
    row.class_instructor_name ||
    row.tutorial_instructor_name ||
    null;
  const className = row.class_title || row.tutorial_title || null;
  const issueDate = row.issued_at
    ? new Date(row.issued_at).toISOString()
    : new Date().toISOString();

  return {
    id: row.id,
    studentId: row.user_id || null,
    studentName: row.student_name || "Student",
    studentEmail: row.student_email || null,
    classId: row.class_id || null,
    className,
    tutorialId: row.tutorial_id || null,
    courseTitle: row.tutorial_title || row.class_title || null,
    templateId: row.template_id || null,
    template: row.template || null,
    certificateCode: row.certificate_code,
    status,
    statusRaw: row.status || "issued",
    issueDate,
    instructorName,
    platformName: APP_NAME,
    grade: row.class_total_score || null,
    verificationUrl: buildVerificationUrl(row.certificate_code),
  };
};

exports.getAll = async ({ page = 1, limit = 10 } = {}) => {
  const { limit: lim, offset } = parsePagination({ page, limit });
  const rows = await baseQuery()
    .orderBy("c.created_at", "desc")
    .offset(offset)
    .limit(lim);
  return rows.map(formatCertificate);
};

exports.getById = async (id) => {
  if (!id) throw new AppError("Certificate id is required", 400);
  const row = await baseQuery().where("c.id", id).first();
  return formatCertificate(row);
};

exports.updateStatus = async (id, status, extra = {}) => {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    throw new AppError("Invalid status supplied", 400);
  }
  const updated = await db("certificates")
    .where({ id })
    .update({ status: normalized, updated_at: db.fn.now(), ...extra });
  if (!updated) {
    return null;
  }
  return exports.getById(id);
};

exports.normalizeStatus = normalizeStatus;
exports.formatCertificate = formatCertificate;
