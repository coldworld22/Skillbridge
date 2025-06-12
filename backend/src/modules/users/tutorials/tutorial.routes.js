// 📁 src/modules/users/tutorials/tutorial.routes.js
const express = require("express");
const router = express.Router();
const controller = require("./tutorial.controller");
const validate = require("../../../middleware/validate");
const upload = require("./tutorialUploadMiddleware");
const tutorialValidator = require("./tutorial.validator");
const { isAdmin, verifyToken } = require("../../../middleware/auth/authMiddleware");

// ✅ Admin routes
router.post(
  "/admin",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "preview", maxCount: 1 },
  ]),
  validate(tutorialValidator.create),
  controller.createTutorial
);

router.get("/admin", verifyToken, isAdmin, controller.getAllTutorials);
router.get("/admin/:id", verifyToken, isAdmin, controller.getTutorialById);

router.put(
  "/admin/:id",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "preview", maxCount: 1 },
  ]),
  validate(tutorialValidator.update),
  controller.updateTutorial
);

router.patch("/admin/:id/trash", verifyToken, isAdmin, controller.softDeleteTutorial);
router.patch("/admin/:id/restore", verifyToken, isAdmin, controller.restoreTutorial);
router.delete("/admin/:id", verifyToken, isAdmin, controller.permanentlyDeleteTutorial);

// ✅ Status and moderation
router.patch("/admin/:id/status", verifyToken, isAdmin, controller.togglePublishStatus);
router.patch("/admin/:id/approve", verifyToken, isAdmin, controller.approveTutorial);
router.patch(
  "/admin/:id/reject",
  verifyToken,
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

router.use("/enroll", require("./enrollments/tutorialEnrollment.routes"));

router.use("/certificate", require("./certificate/tutorialCertificate.routes"));






// ✅ Bulk actions
router.patch("/admin/bulk/approve", verifyToken, isAdmin, controller.bulkApproveTutorials);
router.patch("/admin/bulk/trash", verifyToken, isAdmin, controller.bulkTrashTutorials);

// ✅ Public routes (no auth required)
router.get("/featured", controller.getFeaturedTutorials);
router.get("/", controller.getPublishedTutorials);
router.get("/:id", controller.getPublicTutorialDetails);

module.exports = router;
