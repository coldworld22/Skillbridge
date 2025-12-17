/**
 * Instructor profile controller
 * @file instructor.routes.js
 */
const express = require("express");
const router = express.Router();
const controller = require("./instructor.controller");
const { verifyToken, isInstructor } = require("../../../middleware/auth/authMiddleware");
const { avatarUpload, demoUpload, certificateUpload } = require("./instructorUploadMiddleware");
const { updateInstructorProfileSchema } = require("./instructor.validator");
const validate = require("../../../middleware/validate");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../../middleware/storage");


/**
 * @desc Get instructor profile
 * @route GET /api/users/instructor/profile
 */
router.get("/profile", verifyToken, isInstructor, controller.getProfile);

/**
 * @desc Update instructor profile
 * @route PUT /api/users/instructor/profile
 */
router.put(
  "/profile",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.asset.upload"),
  isInstructor,
  validate(updateInstructorProfileSchema),
  controller.updateProfile
);

/**
 * @desc Upload avatar
 * @route PATCH /api/users/instructor/:id/avatar
 */
router.patch(
  "/:id/avatar",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.asset.upload"),
  isInstructor,
  avatarUpload.single("avatar"),
  checkAndConsumeStorage(),
  controller.updateAvatar
);

// Upload certificate
// This route handles the upload of instructor certificates
router.post(
  "/certificates",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.asset.upload"),
  isInstructor,
  certificateUpload.single("file"),
  checkAndConsumeStorage(),
  controller.uploadCertificate
);

// Delete certificate
router.delete(
  "/certificates/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.asset.upload"),
  isInstructor,
  controller.deleteCertificate
);


/**
 * @desc Get instructor profile status
 * @route GET /api/users/instructor/profile/status
 */
router.get("/profile/status", verifyToken, isInstructor, controller.getProfileStatus);


/**
 * @desc Delete instructor avatar
 * @route DELETE /api/users/instructor/:id/avatar
 */
router.delete(
  "/:id/avatar",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.asset.upload"),
  isInstructor,
  controller.deleteAvatar
);


/**
 * @desc Delete instructor demo video
 * @route DELETE /api/users/instructor/:id/demo
 */
router.delete(
  "/:id/demo",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.asset.upload"),
  isInstructor,
  controller.deleteDemoVideo
);

/**
 * @desc Toggle instructor profile status (active/inactive)
 * @route PATCH /api/users/instructor/status
 */
router.patch("/status", verifyToken, isInstructor, controller.toggleStatus);

// Availability management
router.get(
  "/availability",
  verifyToken,
  isInstructor,
  controller.getAvailability
);
router.patch(
  "/availability",
  verifyToken,
  isInstructor,
  controller.updateAvailability
);


/**
 * @desc Upload demo video (uses authenticated instructor id)
 * @route PATCH /api/users/instructor/demo
 */
router.patch(
  "/demo",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.asset.upload"),
  isInstructor,
  demoUpload.single("demo"),
  checkAndConsumeStorage(),
  controller.uploadDemoVideo
);

/**
 * @desc Upload demo video for a specific instructor id
 * @route PATCH /api/users/instructor/:id/demo
 */
router.patch(
  "/:id/demo",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.asset.upload"),
  isInstructor,
  demoUpload.single("demo"),
  checkAndConsumeStorage(),
  controller.uploadDemoVideo
);

/**
 * @desc Change instructor password
 * @route PATCH /api/users/instructor/change-password
 */
router.patch("/change-password", verifyToken, isInstructor, controller.changePassword);

// Dashboard statistics
router.get(
  "/dashboard-stats",
  verifyToken,
  isInstructor,
  controller.getDashboardStats
);

router.get(
  "/tutorial-views",
  verifyToken,
  isInstructor,
  controller.getTutorialViews
);

module.exports = router;
