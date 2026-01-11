const express = require("express");
const router = express.Router();
const controller = require("./tenantSubscriptions.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.post("/replay", verifyToken, isAdmin, controller.replaySubscriptions);

module.exports = router;
