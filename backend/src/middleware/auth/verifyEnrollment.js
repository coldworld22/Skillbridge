const logger = require('../../utils/logger.js');
const db = require("../../config/database");

module.exports = async function verifyEnrollment(req, res, next) {
  const { roomId } = req.params;
  try {
    const cls = await db("online_classes")
      .select("instructor_id")
      .where({ id: roomId })
      .first();
    if (!cls) return res.status(404).json({ message: "Class not found" });
    const isInstructor = cls.instructor_id === req.user.id;
    let isStudent = false;
    if (!isInstructor) {
      const enrollment = await db("class_enrollments")
        .where({ class_id: roomId, user_id: req.user.id })
        .first();
      if (enrollment) isStudent = true;
    }
    if (!isInstructor && !isStudent)
      return res.status(403).json({ message: "Not allowed" });
    next();
  } catch (err) {
    logger.error("Failed to verify enrollment", err);
    res.status(500).json({ message: "Failed to verify enrollment" });
  }
};
