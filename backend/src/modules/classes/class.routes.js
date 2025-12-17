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
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../middleware/storage");

const optionalAuth = (req, res, next) => {
  const hasToken =
    (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")) ||
    (req.cookies && req.cookies.token);

  if (hasToken) {
    return verifyToken(req, res, next);
  }

  return next();
};

// Student enrollments
router.use("/enroll", require("./enrollments/classEnrollment.routes"));
// Class lessons and assignments
router.use("/lessons", require("./lessons/classLesson.routes"));
router.use(
  "/assignments/submissions",
  require("./assignments/submission.routes"),
);
router.use("/assignments", require("./assignments/classAssignment.routes"));
router.use("/wishlist", require("./wishlist/classWishlist.routes"));
router.use("/likes", require("./likes/classLike.routes"));
router.use(
  "/notifications",
  require("./notifications/classNotification.routes"),
);
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
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isAdmin,
  upload,
  checkAndConsumeStorage(),
  validate(validator.create),
  requireEntitlement("class.create"),
  controller.createClass,
);
router.get(
  "/admin",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isAdmin,
  controller.getAllClasses,
);
router.get(
  "/admin/my",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isAdmin,
  controller.getMyClasses,
);
router.get(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isAdmin,
  controller.getClassById,
);
router.get(
  "/admin/:id/manage",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isAdmin,
  controller.getManagementData,
);
router.get(
  "/admin/:id/analytics",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isAdmin,
  controller.getClassAnalytics,
);
// List students enrolled in a specific class
router.get(
  "/admin/:id/students",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isAdmin,
  enrollmentCtrl.getStudentsByClass,
);
// Fetch details for a single student's enrollment
router.get(
  "/admin/:classId/students/:studentId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isAdmin,
  enrollmentCtrl.getStudent,
);
router.put(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isAdmin,
  upload,
  checkAndConsumeStorage(),
  validate(validator.adminUpdate),
  requireEntitlement("class.update"),
  controller.updateClass,
);
router.delete(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isAdmin,
  requireEntitlement("class.delete"),
  controller.deleteClass,
);
router.patch(
  "/admin/:id/status",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isAdmin,
  requireEntitlement("class.moderate"),
  controller.toggleClassStatus,
);
router.patch(
  "/admin/:id/approve",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isAdmin,
  requireEntitlement("class.moderate"),
  controller.approveClass,
);
router.patch(
  "/admin/:id/reject",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isAdmin,
  validate(validator.reject),
  requireEntitlement("class.moderate"),
  controller.rejectClass,
);

// Instructor routes
router.post(
  "/instructor",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructor,
  upload,
  checkAndConsumeStorage(),
  validate(validator.create),
  requireEntitlement("class.create"),
  controller.createClass,
);
router.get(
  "/instructor/my",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructor,
  controller.getMyClasses,
);
router.get(
  "/instructor/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructor,
  verifyClassOwnership,
  controller.getClassById,
);
router.get(
  "/instructor/:id/manage",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructor,
  verifyClassOwnership,
  controller.getManagementData,
);
router.get(
  "/instructor/:id/analytics",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructor,
  verifyClassOwnership,
  controller.getClassAnalytics,
);
router.get(
  "/instructor/:id/students",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructor,
  verifyClassOwnership,
  enrollmentCtrl.getStudentsByClass,
);
router.get(
  "/instructor/:classId/students/:studentId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructor,
  verifyClassOwnership,
  enrollmentCtrl.getStudent,
);
router.put(
  "/instructor/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructor,
  verifyClassOwnership,
  upload,
  checkAndConsumeStorage(),
  validate(validator.update),
  requireEntitlement("class.update"),
  controller.updateClass,
);
router.delete(
  "/instructor/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructor,
  verifyClassOwnership,
  requireEntitlement("class.delete"),
  controller.deleteClass,
);
router.patch(
  "/instructor/:id/status",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructor,
  verifyClassOwnership,
  requireEntitlement("class.update"),
  controller.toggleClassStatus,
);

// Tags
router.get(
  "/tags",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  tagsController.listTags,
);
router.post(
  "/tags",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  requireEntitlement("class.create"),
  tagsController.createTag,
);

router.get("/", controller.getPublishedClasses);
router.get("/:id", optionalAuth, controller.getPublicClassDetails);

module.exports = router;
