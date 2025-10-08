const express = require("express");
const router = express.Router();
const controller = require("./moderation.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);
router.get("/flags", controller.getFlags);

module.exports = router;
