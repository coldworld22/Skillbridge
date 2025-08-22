const router = require("express").Router();
const ctrl = require("./classAssignment.controller");
const { verifyToken, isInstructorOrAdmin, isAdmin } = require("../../../middleware/auth/authMiddleware");
const validate = require("../../../middleware/validate");
const validator = require("./classAssignment.validator");

router.get("/admin", verifyToken, isAdmin, ctrl.getAllAssignments);
router.get("/class/:classId", ctrl.getAssignmentsByClass);
router.post(
  "/class/:classId",
  verifyToken,
  isInstructorOrAdmin,
  validate(validator.create),
  ctrl.createAssignment
);
router.put("/:assignmentId", verifyToken, isInstructorOrAdmin, ctrl.updateAssignment);
router.delete("/:assignmentId", verifyToken, isInstructorOrAdmin, ctrl.deleteAssignment);

module.exports = router;
