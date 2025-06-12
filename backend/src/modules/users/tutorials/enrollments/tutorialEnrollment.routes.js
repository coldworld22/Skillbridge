const router = require("express").Router();
const ctrl = require("./tutorialEnrollment.controller");
const { verifyToken, isStudent } = require("../../../middleware/authMiddleware");

router.post("/:tutorialId", verifyToken, isStudent, ctrl.enroll);
router.post("/:tutorialId/complete", verifyToken, isStudent, ctrl.complete);
router.get("/my", verifyToken, isStudent, ctrl.getMyEnrollments);

module.exports = router;
