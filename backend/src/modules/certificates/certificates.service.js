/**
 * Certificate admin service
 */
const db = require("../../config/database");

/**
 * Fetch all certificates with related student and class info
 * Supports simple pagination via `page` and `limit` parameters
 */
const { parsePagination } = require("../../utils/pagination");

exports.getAll = async ({ page = 1, limit = 10 } = {}) => {
  const { limit: lim, offset } = parsePagination({ page, limit });

  return db("certificates")
    .leftJoin("users", "certificates.user_id", "users.id")
    .leftJoin("online_classes", "certificates.class_id", "online_classes.id")
    .leftJoin(
      "certificate_templates as tmpl",
      "certificates.template_id",
      "tmpl.id"
    )
    .select(
      "certificates.*",
      "users.full_name as student_name",
      "online_classes.title as class_name",
      db.raw("to_jsonb(tmpl) as template")
    )
    .orderBy("certificates.created_at", "desc")
    .offset(offset)
    .limit(lim);
};
