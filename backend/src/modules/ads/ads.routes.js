const express = require("express");
const router = express.Router();
const controller = require("./ads.controller");
const validate = require("../../middleware/validate");
const { verifyToken, isInstructorOrAdmin } = require("../../middleware/auth/authMiddleware");
const validator = require("./ads.validator");
const upload = require("./adsUploadMiddleware");

router.get(
  "/admin/check-title",
  verifyToken,
  isInstructorOrAdmin,
  controller.checkTitle
);

router.post(
  "/admin",
  verifyToken,
  isInstructorOrAdmin,
  upload,
  validate(validator.create),
  controller.createAd
);
router.get(
  "/admin",
  verifyToken,
  isInstructorOrAdmin,
  validate(validator.list),
  controller.getAllAds
);
router.get("/", validate(validator.list), controller.getAds);
router.post("/:id/view", controller.recordAdView);
router.get(
  "/:id/analytics",
  verifyToken,
  isInstructorOrAdmin,
  controller.getAdAnalytics
);
router.post("/:id/click", controller.recordAdClick);
router.post(
  "/:id/purchase",
  verifyToken,
  isInstructorOrAdmin,
  controller.purchaseAd
);
router.get(
  "/:id",
  verifyToken,
  isInstructorOrAdmin,
  controller.getAdById
);
router.get("/public/:id", controller.getPublicAd);
router.put(
  "/:id",
  verifyToken,
  isInstructorOrAdmin,
  upload,
  validate(validator.update),
  controller.updateAd
);
router.delete(
  "/:id",
  verifyToken,
  isInstructorOrAdmin,
  controller.deleteAd
);

module.exports = router;
