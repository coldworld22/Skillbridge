const express = require("express");
const router = express.Router();
const controller = require("./appConfig.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const logoUpload = require("./appLogoUploadMiddleware");
const faviconUpload = require("./appFaviconUploadMiddleware");

// Log incoming GET requests to debug potential auth or DB issues
router.get("/", (req, res, next) => {
  console.log("[appConfig] GET /api/app-config", {
    user: req.user,
    authHeader: req.headers.authorization,
  });
  controller.getSettings(req, res, next);
});
router.use(verifyToken, isAdmin);
router.put("/", controller.updateSettings);
router.patch("/logo", logoUpload.single("logo"), controller.uploadLogo);
router.patch("/favicon", faviconUpload.single("favicon"), controller.uploadFavicon);
module.exports = router;
