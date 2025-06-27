const express = require("express");
const router = express.Router();
const controller = require("./appConfig.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const upload = require("./appLogoUploadMiddleware");
router.get("/", controller.getSettings);
router.use(verifyToken, isAdmin);
router.put("/", controller.updateSettings);
router.patch("/logo", upload.single("logo"), controller.uploadLogo);


module.exports = router;
