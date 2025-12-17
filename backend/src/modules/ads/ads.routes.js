const express = require("express");
const router = express.Router();
const controller = require("./ads.controller");
const validate = require("../../middleware/validate");
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../middleware/auth/authMiddleware");
const validator = require("./ads.validator");
const upload = require("./adsUploadMiddleware");
const rateLimit = require("express-rate-limit");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../middleware/storage");

const viewLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
const clickLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

router.get(
  "/admin/check-title",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  controller.checkTitle,
);

router.post(
  "/admin",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  upload,
  checkAndConsumeStorage(),
  validate(validator.create),
  requireEntitlement("ad.create"),
  controller.createAd,
);
router.get(
  "/admin",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  validate(validator.list),
  controller.getAllAds,
);
router.get("/", validate(validator.list), controller.getAds);
router.post("/:id/view", viewLimiter, controller.recordAdView);
router.get(
  "/:id/analytics",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  controller.getAdAnalytics,
);
router.post("/:id/click", clickLimiter, controller.recordAdClick);
router.post(
  "/:id/purchase",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  requireEntitlement("ad.update"),
  controller.purchaseAd,
);
router.get(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  controller.getAdById,
);
router.get("/public/:id", controller.getPublicAd);
router.put(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  upload,
  checkAndConsumeStorage(),
  validate(validator.update),
  requireEntitlement("ad.update"),
  controller.updateAd,
);
router.delete(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  requireEntitlement("ad.delete"),
  controller.deleteAd,
);

module.exports = router;
