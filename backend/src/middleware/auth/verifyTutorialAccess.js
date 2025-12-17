const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const { normalizeRole, isAdminRole } = require("../../utils/role");

module.exports = async function verifyTutorialAccess(req, res, next) {
  const { tutorialId } = req.params;
  const userId = req.user.id;

  try {
    const tutorial = await db("tutorials")
      .select("instructor_id")
      .where({ id: tutorialId })
      .first();

    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });

    const roles = req.user.roles || [req.user.role];
    const isAdmin = isAdminRole(roles);
    const norm = roles.map((r) => normalizeRole(r));
    const isInstructor = norm.includes("instructor") && tutorial.instructor_id === userId;

    if (!isAdmin && !isInstructor) {
      const enrollment = await db("tutorial_enrollments")
        .where({ tutorial_id: tutorialId, user_id: userId })
        .first();
      if (!enrollment) return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err) {
    logger.error("Failed to verify tutorial access", err);
    res.status(500).json({ message: "Failed to verify tutorial access" });
  }
};
