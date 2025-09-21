const express = require("express");
const router = express.Router();
const controller = require("./moderation.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);
router.get("/flags", controller.getFlags);

module.exports = router;
