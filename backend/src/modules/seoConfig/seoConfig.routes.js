const express = require("express");
const router = express.Router();
const controller = require("./seoConfig.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.getSettings);
router.use(verifyToken, isAdmin);
router.put("/", controller.updateSettings);

module.exports = router;
