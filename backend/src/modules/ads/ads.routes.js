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
  controller.getAllAds
);
router.get("/", controller.getAds);
router.post("/:id/view", controller.recordAdView);
router.get("/:id/analytics", controller.getAdAnalytics);
router.post("/:id/click", controller.recordAdClick);
router.get("/:id", controller.getAdById);
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
