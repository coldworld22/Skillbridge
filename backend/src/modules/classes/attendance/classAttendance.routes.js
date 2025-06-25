const router = require("express").Router();
const ctrl = require("./classAttendance.controller");
const { verifyToken, isInstructorOrAdmin } = require("../../../middleware/auth/authMiddleware");

router.get("/:classId", verifyToken, isInstructorOrAdmin, ctrl.listByClass);
router.post("/:classId/:userId", verifyToken, isInstructorOrAdmin, ctrl.updateAttendance);

module.exports = router;
