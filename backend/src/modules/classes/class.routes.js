const express = require("express");
const router = express.Router();
const controller = require("./class.controller");
const validate = require("../../middleware/validate");
const validator = require("./class.validator");
const upload = require("./classUploadMiddleware");
const {
  verifyToken,
  isInstructorOrAdmin,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");

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
  "/admin/:id",
  verifyToken,
  isInstructorOrAdmin,
  controller.getClassById
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

router.get("/", controller.getPublishedClasses);
router.get("/:id", controller.getPublicClassDetails);

module.exports = router;
