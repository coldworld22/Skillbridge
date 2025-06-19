const express = require("express");
const router = express.Router();
const controller = require("./ads.controller");
const validate = require("../../middleware/validate");
const { verifyToken, isInstructorOrAdmin } = require("../../middleware/auth/authMiddleware");
const validator = require("./ads.validator");
const upload = require("./adsUploadMiddleware");

router.post(
  "/admin",
  verifyToken,
  isInstructorOrAdmin,
  upload.single("image"),
  validate(validator.create),
  controller.createAd
);
router.get("/", controller.getAds);
router.get("/:id/analytics", controller.getAdAnalytics);
router.get("/:id", controller.getAdById);
router.put(
  "/:id",
  verifyToken,
  isInstructorOrAdmin,
  upload.single("image"),
  controller.updateAd
);
router.delete(
  "/:id",
  verifyToken,
  isInstructorOrAdmin,
  controller.deleteAd
);

module.exports = router;
