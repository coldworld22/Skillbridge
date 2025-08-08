const router = require("express").Router();
const ctrl = require("./submission.controller");
const {
  verifyToken,
  isStudent,
  isInstructorOrAdmin,
} = require("../../../middleware/auth/authMiddleware");

router.get(
  "/assignment/:assignmentId",
  verifyToken,
  isInstructorOrAdmin,
  ctrl.getByAssignment
);
router.post(
  "/assignment/:assignmentId",
  verifyToken,
  isStudent,
  ctrl.createSubmission
);
router.put(
  "/:submissionId",
  verifyToken,
  isInstructorOrAdmin,
  ctrl.updateSubmission
);
router.delete(
  "/:submissionId",
  verifyToken,
  isInstructorOrAdmin,
  ctrl.deleteSubmission
);

module.exports = router;
