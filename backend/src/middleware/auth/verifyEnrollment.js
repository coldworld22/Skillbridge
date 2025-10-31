const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const { isAdminRole } = require("../../utils/role");

module.exports = async function verifyEnrollment(req, res, next) {
  const classId = req.params.roomId || req.params.classId || req.params.id;
  try {
    const cls = await db("online_classes")
      .select("instructor_id")
      .where({ id: classId })
      .first();
    if (!cls) return res.status(404).json({ message: "Class not found" });
    const isInstructor = cls.instructor_id === req.user.id;
    let isStudent = false;
    if (!isInstructor) {
      const enrollment = await db("class_enrollments")
        .where({ class_id: classId, user_id: req.user.id })
        .first();
      if (enrollment) {
        if (enrollment.status === "suspended") {
          return res
            .status(403)
            .json({ message: "Enrollment suspended pending installment payment" });
        }
        if (enrollment.status !== "cancelled") {
          isStudent = true;
        }
      }
    }
    const roles = req.user.roles || [req.user.role];
    const isAdmin = isAdminRole(roles);
    if (!isInstructor && !isStudent && !isAdmin)
      return res.status(403).json({ message: "Not allowed" });
    next();
  } catch (err) {
    logger.error("Failed to verify enrollment", err);
    res.status(500).json({ message: "Failed to verify enrollment" });
  }
};
