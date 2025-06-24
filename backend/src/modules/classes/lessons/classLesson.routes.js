const router = require("express").Router();
const ctrl = require("./classLesson.controller");
const { verifyToken, isInstructorOrAdmin } = require("../../../middleware/auth/authMiddleware");

router.get("/class/:classId", ctrl.getLessonsByClass);
router.post("/class/:classId", verifyToken, isInstructorOrAdmin, ctrl.createLesson);
router.put("/:lessonId", verifyToken, isInstructorOrAdmin, ctrl.updateLesson);
router.delete("/:lessonId", verifyToken, isInstructorOrAdmin, ctrl.deleteLesson);

module.exports = router;
