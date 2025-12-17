const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const { isAdminRole } = require("../../utils/role");

module.exports = async function verifyLessonOwnership(req, res, next) {
  const { lessonId } = req.params;
  try {
    const lesson = await db("class_lessons as l")
      .join("online_classes as c", "l.class_id", "c.id")
      .select("c.instructor_id", "l.class_id")
      .where("l.id", lessonId)
      .first();

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // set classId param for downstream middlewares
    req.params.classId = lesson.class_id;

    const roles = req.user.roles || [req.user.role];
    const isAdmin = isAdminRole(roles);

    if (lesson.instructor_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err) {
    logger.error("Failed to verify lesson ownership", err);
    res.status(500).json({ message: "Failed to verify lesson ownership" });
  }
};
