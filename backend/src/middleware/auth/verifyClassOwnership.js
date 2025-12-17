const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const { isAdminRole } = require("../../utils/role");

module.exports = async function verifyClassOwnership(req, res, next) {
  const classId = req.params.id || req.params.classId;
  try {
    const cls = await db("online_classes")
      .select("instructor_id")
      .where({ id: classId })
      .first();

    if (!cls) return res.status(404).json({ message: "Class not found" });

    const roles = req.user.roles || [req.user.role];
    const isAdmin = isAdminRole(roles);

    if (cls.instructor_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err) {
    logger.error("Failed to verify class ownership", err);
    res.status(500).json({ message: "Failed to verify class ownership" });
  }
};
