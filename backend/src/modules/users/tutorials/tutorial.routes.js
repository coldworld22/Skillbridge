// 📁 src/modules/users/tutorials/tutorial.routes.js
const express = require("express");
const router = express.Router();
const controller = require("./tutorial.controller");
const validate = require("../../../middleware/validate");
const upload = require("./tutorialUploadMiddleware");
const tutorialValidator = require("./tutorial.validator");
const { isAdmin, verifyToken, isInstructorOrAdmin } = require("../../../middleware/auth/authMiddleware");
const tagController = require("./tutorialTag.controller");

// ✅ Admin routes
router.post(
  "/admin",
  verifyToken,
  isInstructorOrAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "preview", maxCount: 1 },
  ]),
  validate(tutorialValidator.create),
  controller.createTutorial
);

router.get("/admin", verifyToken, isInstructorOrAdmin, controller.getAllTutorials);
router.get("/admin/my", verifyToken, isInstructorOrAdmin, controller.getMyTutorials);
router.get("/admin/:id", verifyToken, isInstructorOrAdmin, controller.getTutorialById);
router.get(
  "/admin/:id/analytics",
  verifyToken,
  isInstructorOrAdmin,
  controller.getTutorialAnalytics
);

router.put(
  "/admin/:id",
  verifyToken,
  isInstructorOrAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "preview", maxCount: 1 },
  ]),
  validate(tutorialValidator.update),
  controller.updateTutorial
);

router.delete("/admin/:id", verifyToken, isInstructorOrAdmin, controller.permanentlyDeleteTutorial);

// ✅ Status and moderation
router.patch("/admin/:id/status", verifyToken, isInstructorOrAdmin, controller.togglePublishStatus);
router.patch("/admin/:id/approve", verifyToken, isAdmin, controller.approveTutorial);
router.patch(
  "/admin/:id/reject",
  verifyToken,
  isAdmin,
  validate(tutorialValidator.reject),
  controller.rejectTutorial
);
router.patch(
  "/admin/:id/suspend",
  verifyToken,
  isAdmin,
  controller.suspendTutorial
);

/*
 * ✅ Tutorial chapters routes  
*/
router.use("/chapters", require("./chapters/tutorialChapter.routes"));

router.use("/reviews", require("./reviews/tutorialReview.routes"));

router.use("/comments", require("./comments/tutorialComment.routes"));

router.get("/tags", verifyToken, isInstructorOrAdmin, tagController.listTags);
router.post("/tags", verifyToken, isInstructorOrAdmin, tagController.createTag);

router.use("/enroll", require("./enrollments/tutorialEnrollment.routes"));
router.use("/wishlist", require("./wishlist/tutorialWishlist.routes"));

router.use("/certificate", require("./certificate/tutorialCertificate.routes"));






// ✅ Bulk actions
router.patch("/admin/bulk/approve", verifyToken, isAdmin, controller.bulkApproveTutorials);
router.post("/admin/bulk-delete", verifyToken, isAdmin, controller.bulkDeleteTutorials);



// ✅ Public routes (no auth required)
router.get("/featured", controller.getFeaturedTutorials);
router.get("/category/:categoryId", controller.getTutorialsByCategory);
router.get("/", controller.getPublishedTutorials);
router.get("/:id", controller.getPublicTutorialDetails);

module.exports = router;
