const express = require("express");
const router = express.Router();
const controller = require("./seoConfig.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const upload = require("./seoImageUploadMiddleware");

router.get("/", controller.getSettings);
router.use(verifyToken, isAdmin);
router.put("/", controller.updateSettings);
router.post("/sitemap/regenerate", controller.regenerateSitemap);
router.get("/meta-scan", controller.scanMetaIssues);
router.get("/pages", controller.listPages);
router.post("/upload-image", upload.single("image"), controller.uploadImage);

module.exports = router;
