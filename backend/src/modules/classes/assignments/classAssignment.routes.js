const router = require("express").Router();
const ctrl = require("./classAssignment.controller");
const { verifyToken, isInstructorOrAdmin } = require("../../../middleware/auth/authMiddleware");

router.get("/class/:classId", ctrl.getAssignmentsByClass);
router.post("/class/:classId", verifyToken, isInstructorOrAdmin, ctrl.createAssignment);
router.put("/:assignmentId", verifyToken, isInstructorOrAdmin, ctrl.updateAssignment);
router.delete("/:assignmentId", verifyToken, isInstructorOrAdmin, ctrl.deleteAssignment);

module.exports = router;
