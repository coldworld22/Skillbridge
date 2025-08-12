const router = require("express").Router();
const ctrl = require("./submission.controller");
const { verifyToken, isStudent } = require("../../../../middleware/auth/authMiddleware");

router.get("/assignment/:assignmentId", verifyToken, isStudent, ctrl.getMySubmission);
router.post("/assignment/:assignmentId", verifyToken, isStudent, ctrl.createSubmission);
router.put("/:submissionId", verifyToken, isStudent, ctrl.updateSubmission);

module.exports = router;
