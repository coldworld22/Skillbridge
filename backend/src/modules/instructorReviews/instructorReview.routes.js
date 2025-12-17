const router = require("express").Router();
const controller = require("./instructorReview.controller");
const {
  verifyToken,
  isStudent,
} = require("../../middleware/auth/authMiddleware");

router.get("/instructor/:instructorId", controller.listByInstructor);
router.get("/student/me", verifyToken, isStudent, controller.listByStudent);
router.get(
  "/student/me/eligible",
  verifyToken,
  isStudent,
  controller.getEligibleInstructors
);
router.post("/", verifyToken, isStudent, controller.submitReview);
router.put("/:id", verifyToken, isStudent, controller.updateReview);
router.delete("/:id", verifyToken, isStudent, controller.deleteReview);

module.exports = router;
