const express = require("express");
const router = express.Router();
const controller = require("./class.controller");
const tagsController = require("./classTag.controller");
const validate = require("../../middleware/validate");
const validator = require("./class.validator");
const upload = require("./classUploadMiddleware");
const {
  verifyToken,
  isInstructorOrAdmin,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");

// Student enrollments
router.use("/enroll", require("./enrollments/classEnrollment.routes"));
// Class lessons and assignments
router.use("/lessons", require("./lessons/classLesson.routes"));
router.use("/assignments", require("./assignments/classAssignment.routes"));
// Attendance tracking
router.use("/attendance", require("./attendance/classAttendance.routes"));

router.post(
  "/admin",
  verifyToken,
  isInstructorOrAdmin,
  upload,
  validate(validator.create),
  controller.createClass
);
router.get("/admin", verifyToken, isInstructorOrAdmin, controller.getAllClasses);
router.get(
  "/admin/my",
  verifyToken,
  isInstructorOrAdmin,
  controller.getMyClasses
);
router.get(
  "/admin/:id",
  verifyToken,
  isInstructorOrAdmin,
  controller.getClassById
);
router.get(
  "/admin/:id/manage",
  verifyToken,
  isInstructorOrAdmin,
  controller.getManagementData
);
router.get(
  "/admin/:id/analytics",
  verifyToken,
  isInstructorOrAdmin,
  controller.getClassAnalytics
);
router.put(
  "/admin/:id",
  verifyToken,
  isInstructorOrAdmin,
  upload,
  validate(validator.update),
  controller.updateClass
);
router.delete(
  "/admin/:id",
  verifyToken,
  isInstructorOrAdmin,
  controller.deleteClass
);
router.patch(
  "/admin/:id/status",
  verifyToken,
  isInstructorOrAdmin,
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

// Tags
router.get("/tags", verifyToken, isInstructorOrAdmin, tagsController.listTags);
router.post("/tags", verifyToken, isInstructorOrAdmin, tagsController.createTag);

router.get("/", controller.getPublishedClasses);
router.get("/:id", controller.getPublicClassDetails);

module.exports = router;
