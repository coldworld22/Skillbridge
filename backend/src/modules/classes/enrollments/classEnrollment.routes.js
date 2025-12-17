const router = require("express").Router();
const ctrl = require("./classEnrollment.controller");
const { verifyToken, isStudent } = require("../../../middleware/auth/authMiddleware");

router.post("/:classId", verifyToken, isStudent, ctrl.enroll);
router.post("/:classId/complete", verifyToken, isStudent, ctrl.complete);
router.get("/my", verifyToken, isStudent, ctrl.getMyEnrollments);

module.exports = router;
