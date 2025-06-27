const express = require("express");
const router = express.Router();
const controller = require("./appConfig.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const logoUpload = require("./appLogoUploadMiddleware");
const faviconUpload = require("./appFaviconUploadMiddleware");

router.get("/", controller.getSettings);
router.use(verifyToken, isAdmin);
router.put("/", controller.updateSettings);
router.patch("/logo", logoUpload.single("logo"), controller.uploadLogo);
router.patch("/favicon", faviconUpload.single("favicon"), controller.uploadFavicon);
module.exports = router;
