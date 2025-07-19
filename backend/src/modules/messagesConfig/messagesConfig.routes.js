const express = require("express");
const router = express.Router();
const controller = require("./messagesConfig.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.get("/", controller.getSettings);
router.put("/", controller.updateSettings);

module.exports = router;
