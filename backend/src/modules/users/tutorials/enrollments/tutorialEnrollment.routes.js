const router = require("express").Router();
const ctrl = require("./tutorialEnrollment.controller");
const { verifyToken, isStudent } = require("../../../../middleware/auth/authMiddleware");
const validate = require("../../../../middleware/validate");
const validator = require("./tutorialEnrollment.validator");

router.post("/:tutorialId", verifyToken, isStudent, ctrl.enroll);
router.post("/:tutorialId/complete", verifyToken, isStudent, ctrl.complete);
router.get("/:tutorialId/status", verifyToken, isStudent, ctrl.getStatus);
router.patch(
  "/:tutorialId/progress",
  verifyToken,
  isStudent,
  validate(validator.updateProgress),
  ctrl.updateProgress
);
router.get("/my", verifyToken, isStudent, ctrl.getMyEnrollments);

module.exports = router;
