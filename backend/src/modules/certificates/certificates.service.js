/**
 * Certificate admin service
 */
const db = require("../../config/database");
const {
  TEMPLATE_SELECT_FIELDS,
  applyTemplateJoin,
  formatCertificateRow,
} = require("./certificate.utils");

/**
 * Fetch all certificates with related student and class info
 * Supports simple pagination via `page` and `limit` parameters
 */
const { parsePagination } = require("../../utils/pagination");

exports.getAll = async ({ page = 1, limit = 10 } = {}) => {
  const { limit: lim, offset } = parsePagination({ page, limit });

  const query = db("certificates")
    .leftJoin("users", "certificates.user_id", "users.id")
    .leftJoin("online_classes", "certificates.class_id", "online_classes.id")
    .leftJoin(
      "certificate_templates as template",
      "certificates.template_id",
      "template.id",
    )
    .select(
      "certificates.*",
      "users.full_name as student_name",
      "online_classes.title as class_name",
      "template.name as template_name",
      "template.type as template_type",
      "template.font_family as template_font_family",
      "template.title_font as template_title_font",
      "template.border_color as template_border_color",
      "template.logo as template_logo",
      "template.background as template_background",
      "template.show_qr as template_show_qr"
    )
    .orderBy("certificates.created_at", "desc")
    .offset(offset)
    .limit(lim);

  return rows.map(formatCertificateRow);
};

exports.getById = async (id) => {
  const query = db("certificates")
    .leftJoin("users", "certificates.user_id", "users.id")
    .leftJoin("online_classes", "certificates.class_id", "online_classes.id");

  applyTemplateJoin(query);

  const row = await query
    .select(
      "certificates.*",
      "users.full_name as student_name",
      "online_classes.title as class_name",
      ...TEMPLATE_SELECT_FIELDS
    )
    .where("certificates.id", id)
    .first();

  return formatCertificateRow(row);
};
