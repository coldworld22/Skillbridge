const express = require("express");
const router = express.Router();
const ctrl = require("./tutorialChapter.controller");
const { verifyToken, isInstructorOrAdmin } = require("../../../../middleware/auth/authMiddleware");
const uploadChapterVideo = require("./uploadChapterVideo");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../../../middleware/storage");

// Optional auth middleware: attaches user if token provided, otherwise continues
const optionalAuth = (req, res, next) => {
  const hasToken =
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) ||
    (req.cookies && req.cookies.token);
  if (hasToken) {
    return verifyToken(req, res, next);
  }
  return next();
};

// Upload chapter video
router.post(
  "/upload",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  uploadChapterVideo,
  checkAndConsumeStorage(),
  ctrl.uploadVideo
);

router.post(
  "/",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  ctrl.createChapter
);
router.patch(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  ctrl.updateChapter
);
router.delete(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  ctrl.deleteChapter
);
router.get("/tutorial/:tutorialId", optionalAuth, ctrl.getChaptersByTutorial); // allow guest or enrolled
router.patch(
  "/tutorial/:tutorialId/reorder",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("asset.upload"),
  isInstructorOrAdmin,
  ctrl.reorderChapters
);


module.exports = router;
