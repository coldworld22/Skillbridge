const router = require("express").Router();
const ctrl = require("./classAssignment.controller");
const {
  verifyToken,
  isInstructorOrAdmin,
  isAdmin,
} = require("../../../middleware/auth/authMiddleware");
const verifyEnrollment = require("../../../middleware/auth/verifyEnrollment");
const verifyClassOwnership = require("../../../middleware/auth/verifyClassOwnership");
const verifyAssignmentOwnership = require("../../../middleware/auth/verifyAssignmentOwnership");
const validate = require("../../../middleware/validate");
const validator = require("./classAssignment.validator");

router.get("/admin", verifyToken, isAdmin, ctrl.getAllAssignments);
router.get(
  "/class/:classId",
  verifyToken,
  verifyEnrollment,
  ctrl.getAssignmentsByClass
);
router.get("/:assignmentId", verifyToken, ctrl.getAssignment);
router.post(
  "/class/:classId",
  verifyToken,
  isInstructorOrAdmin,
  verifyClassOwnership,
  validate(validator.create),
  ctrl.createAssignment
);
router.put(
  "/:assignmentId",
  verifyToken,
  isInstructorOrAdmin,
  verifyAssignmentOwnership,
  ctrl.updateAssignment
);
router.delete(
  "/:assignmentId",
  verifyToken,
  isInstructorOrAdmin,
  verifyAssignmentOwnership,
  ctrl.deleteAssignment
);

module.exports = router;
