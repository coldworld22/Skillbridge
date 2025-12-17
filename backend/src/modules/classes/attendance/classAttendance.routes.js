const router = require("express").Router();
const ctrl = require("./classAttendance.controller");
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../../middleware/auth/authMiddleware");
const verifyLessonOwnership = require("../../../middleware/auth/verifyLessonOwnership");

router.get(
  "/:lessonId",
  verifyToken,
  isInstructorOrAdmin,
  verifyLessonOwnership,
  ctrl.listByClass
);
router.post(
  "/:lessonId/:userId",
  verifyToken,
  isInstructorOrAdmin,
  verifyLessonOwnership,
  ctrl.updateAttendance
);

module.exports = router;
