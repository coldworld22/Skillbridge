const express = require("express");
const router = express.Router();
const controller = require("./class.controller");
const tagsController = require("./classTag.controller");
const enrollmentCtrl = require("./enrollments/classEnrollment.controller");
const validate = require("../../middleware/validate");
const validator = require("./class.validator");
const upload = require("./classUploadMiddleware");
const verifyClassOwnership = require("../../middleware/auth/verifyClassOwnership");
const {
  verifyToken,
  isInstructorOrAdmin,
  isAdmin,
  isInstructor,
} = require("../../middleware/auth/authMiddleware");

// Student enrollments
router.use("/enroll", require("./enrollments/classEnrollment.routes"));
// Class lessons and assignments
router.use("/lessons", require("./lessons/classLesson.routes"));
router.use("/assignments/submissions", require("./assignments/submission.routes"));
router.use("/assignments", require("./assignments/classAssignment.routes"));
router.use("/wishlist", require("./wishlist/classWishlist.routes"));
router.use("/likes", require("./likes/classLike.routes"));
router.use("/notifications", require("./notifications/classNotification.routes"));
router.use("/resources", require("./resources/classResource.routes"));
// Attendance tracking
router.use("/attendance", require("./attendance/classAttendance.routes"));
// Reviews and comments
router.use("/reviews", require("./reviews/classReview.routes"));
router.use("/comments", require("./comments/classComment.routes"));
// Final scoring and certificates
router.use("/scores", require("./scores/classScore.routes"));
router.use("/admin/:id/rules", require("./rules/classRule.routes"));

router.post(
  "/admin",
  verifyToken,
  isAdmin,
  upload,
  validate(validator.create),
  controller.createClass
);
router.get("/admin", verifyToken, isAdmin, controller.getAllClasses);
router.get(
  "/admin/my",
  verifyToken,
  isAdmin,
  controller.getMyClasses
);
router.get(
  "/admin/:id",
  verifyToken,
  isAdmin,
  controller.getClassById
);
router.get(
  "/admin/:id/manage",
  verifyToken,
  isAdmin,
  controller.getManagementData
);
router.get(
  "/admin/:id/analytics",
  verifyToken,
  isAdmin,
  controller.getClassAnalytics
);
// List students enrolled in a specific class
router.get(
  "/admin/:id/students",
  verifyToken,
  isAdmin,
  enrollmentCtrl.getStudentsByClass
);
// Fetch details for a single student's enrollment
router.get(
  "/admin/:classId/students/:studentId",
  verifyToken,
  isAdmin,
  enrollmentCtrl.getStudent
);
router.put(
  "/admin/:id",
  verifyToken,
  isAdmin,
  upload,
  validate(validator.adminUpdate),
  controller.updateClass
);
router.delete(
  "/admin/:id",
  verifyToken,
  isAdmin,
  controller.deleteClass
);
router.patch(
  "/admin/:id/status",
  verifyToken,
  isAdmin,
  controller.toggleClassStatus
);
router.patch(
  "/admin/:id/approve",
  verifyToken,
  isAdmin,
  controller.approveClass
);
router.patch(
  "/admin/:id/reject",
  verifyToken,
  isAdmin,
  validate(validator.reject),
  controller.rejectClass
);

// Instructor routes
router.post(
  "/instructor",
  verifyToken,
  isInstructor,
  upload,
  validate(validator.create),
  controller.createClass
);
router.get(
  "/instructor/my",
  verifyToken,
  isInstructor,
  controller.getMyClasses
);
router.get(
  "/instructor/:id",
  verifyToken,
  isInstructor,
  verifyClassOwnership,
  controller.getClassById
);
router.get(
  "/instructor/:id/manage",
  verifyToken,
  isInstructor,
  verifyClassOwnership,
  controller.getManagementData
);
router.get(
  "/instructor/:id/analytics",
  verifyToken,
  isInstructor,
  verifyClassOwnership,
  controller.getClassAnalytics
);
router.get(
  "/instructor/:id/students",
  verifyToken,
  isInstructor,
  verifyClassOwnership,
  enrollmentCtrl.getStudentsByClass
);
router.get(
  "/instructor/:classId/students/:studentId",
  verifyToken,
  isInstructor,
  verifyClassOwnership,
  enrollmentCtrl.getStudent
);
router.put(
  "/instructor/:id",
  verifyToken,
  isInstructor,
  verifyClassOwnership,
  upload,
  validate(validator.update),
  controller.updateClass
);
router.delete(
  "/instructor/:id",
  verifyToken,
  isInstructor,
  verifyClassOwnership,
  controller.deleteClass
);
router.patch(
  "/instructor/:id/status",
  verifyToken,
  isInstructor,
  verifyClassOwnership,
  controller.toggleClassStatus
);

// Tags
router.get("/tags", verifyToken, isInstructorOrAdmin, tagsController.listTags);
router.post("/tags", verifyToken, isInstructorOrAdmin, tagsController.createTag);

router.get("/", controller.getPublishedClasses);
router.get("/:id", controller.getPublicClassDetails);

module.exports = router;
