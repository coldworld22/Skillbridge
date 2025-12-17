// 📁 src/modules/users/tutorials/tutorial.routes.js
const express = require("express");
const router = express.Router();
const controller = require("./tutorial.controller");
const validate = require("../../../middleware/validate");
const upload = require("./tutorialUploadMiddleware");
const tutorialValidator = require("./tutorial.validator");
const { isAdmin, verifyToken, isInstructorOrAdmin } = require("../../../middleware/auth/authMiddleware");
const tagController = require("./tutorialTag.controller");
const tagValidator = require("./tutorialTag.validator");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../../middleware/storage");

// ✅ Admin routes
router.post(
  "/admin",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "preview", maxCount: 1 },
  ]),
  checkAndConsumeStorage(),
  validate(tutorialValidator.create),
  controller.createTutorial
);

router.get(
  "/admin",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  controller.getAllTutorials
);
router.get(
  "/admin/my",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  controller.getMyTutorials
);
router.get(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  controller.getTutorialById
);
router.get(
  "/admin/:id/analytics",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  controller.getTutorialAnalytics
);

router.put(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "preview", maxCount: 1 },
  ]),
  checkAndConsumeStorage(),
  validate(tutorialValidator.update),
  controller.updateTutorial
);

router.delete(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  controller.permanentlyDeleteTutorial
);

// ✅ Status and moderation
router.patch(
  "/admin/:id/status",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  controller.togglePublishStatus
);
router.patch(
  "/admin/:id/approve",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isAdmin,
  controller.approveTutorial
);
router.patch(
  "/admin/:id/reject",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isAdmin,
  validate(tutorialValidator.reject),
  controller.rejectTutorial
);

/*
 * ✅ Tutorial chapters routes  
*/
router.use("/chapters", require("./chapters/tutorialChapter.routes"));

router.use("/reviews", require("./reviews/tutorialReview.routes"));

router.use("/comments", require("./comments/tutorialComment.routes"));

router.get("/tags", verifyToken, isInstructorOrAdmin, tagController.listTags);
router.post(
  "/tags",
  verifyToken,
  isInstructorOrAdmin,
  validate(tagValidator.create),
  tagController.createTag
);

router.use("/enroll", require("./enrollments/tutorialEnrollment.routes"));
router.use("/wishlist", require("./wishlist/tutorialWishlist.routes"));
router.use("/favorites", require("./favorites/tutorialFavorite.routes"));
router.use("/assignments", require("./assignments/tutorialAssignment.routes"));
router.use("/assignments/submissions", require("./assignments/submission.routes"));

router.use("/certificate", require("./certificate/tutorialCertificate.routes"));






// ✅ Bulk actions
router.patch(
  "/admin/bulk/approve",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isAdmin,
  controller.bulkApproveTutorials
);
router.post(
  "/admin/bulk-delete",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isAdmin,
  controller.bulkDeleteTutorials
);



// ✅ Public routes (no auth required)
router.get("/featured", controller.getFeaturedTutorials);
router.get("/category/:categoryId", controller.getTutorialsByCategory);
router.get("/", controller.getPublishedTutorials);
router.get("/:id", controller.getPublicTutorialDetails);

module.exports = router;
