/**
 * Certificate admin service
 */
const db = require("../../config/database");

/**
 * Fetch all certificates with related student and class info
 */
exports.getAll = async () => {
  return db("certificates")
    .leftJoin("users", "certificates.user_id", "users.id")
    .leftJoin("online_classes", "certificates.class_id", "online_classes.id")
    .select(
      "certificates.*",
      "users.full_name as student_name",
      "online_classes.title as class_name"
    )
    .orderBy("certificates.created_at", "desc");
};
