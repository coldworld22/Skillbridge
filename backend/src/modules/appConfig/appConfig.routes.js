const logger = require("../../utils/logger.js");
const express = require("express");
const router = express.Router();
const controller = require("./appConfig.controller");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const logoUpload = require("./appLogoUploadMiddleware");
const faviconUpload = require("./appFaviconUploadMiddleware");
const homeBgUpload = require("./appHomeBgUploadMiddleware");
const { checkAndConsumeStorage } = require("../../middleware/storage");

// Log incoming GET requests to debug potential auth or DB issues
router.get("/", (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    logger.debug("[appConfig] GET /api/app-config", {
      user: req.user,
      authHeader: req.headers.authorization,
    });
  }
  controller.getSettings(req, res, next);
});
router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("config.app.manage"),
  isAdmin,
);
router.put("/", controller.updateSettings);
router.patch(
  "/logo",
  logoUpload.single("logo"),
  checkAndConsumeStorage(),
  controller.uploadLogo,
);
router.patch(
  "/favicon",
  faviconUpload.single("favicon"),
  checkAndConsumeStorage(),
  controller.uploadFavicon,
);
router.patch(
  "/home-bg",
  homeBgUpload.single("home_bg"),
  checkAndConsumeStorage(),
  controller.uploadHomeBackground,
);
module.exports = router;
