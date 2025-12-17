const router = require("express").Router();
const ctrl = require("./classLesson.controller");
const upload = require("./classLessonUploadMiddleware");
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../../middleware/auth/authMiddleware");
const verifyClassOwnership = require("../../../middleware/auth/verifyClassOwnership");
const verifyLessonOwnership = require("../../../middleware/auth/verifyLessonOwnership");
const verifyClassAccess = require("../../../middleware/auth/verifyClassAccess");

router.get(
  "/class/:classId",
  verifyToken,
  verifyClassAccess,
  ctrl.getLessonsByClass
);
router.post(
  "/class/:classId",
  verifyToken,
  isInstructorOrAdmin,
  verifyClassOwnership,
  upload,
  ctrl.createLesson
);
router.put(
  "/:lessonId",
  verifyToken,
  isInstructorOrAdmin,
  verifyLessonOwnership,
  verifyClassOwnership,
  upload,
  ctrl.updateLesson
);
router.delete(
  "/:lessonId",
  verifyToken,
  isInstructorOrAdmin,
  verifyLessonOwnership,
  verifyClassOwnership,
  ctrl.deleteLesson
);

module.exports = router;
