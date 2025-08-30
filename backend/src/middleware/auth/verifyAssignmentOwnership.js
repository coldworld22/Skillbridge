const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const { isAdminRole } = require("../../utils/role");

module.exports = async function verifyAssignmentOwnership(req, res, next) {
  const assignmentId = req.params.assignmentId || req.params.id;
  try {
    const row = await db("class_assignments as ca")
      .join("online_classes as c", "ca.class_id", "c.id")
      .select("c.instructor_id")
      .where("ca.id", assignmentId)
      .first();
    if (!row) return res.status(404).json({ message: "Assignment not found" });
    const roles = req.user.roles || [req.user.role];
    const isAdmin = isAdminRole(roles);
    if (row.instructor_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  } catch (err) {
    logger.error("Failed to verify assignment ownership", err);
    res.status(500).json({ message: "Failed to verify assignment ownership" });
  }
};
