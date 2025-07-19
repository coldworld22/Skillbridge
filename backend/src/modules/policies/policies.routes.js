const express = require("express");
const router = express.Router();
const controller = require("./policies.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.getPolicies);
router.use(verifyToken, isAdmin);
router.put("/", controller.updatePolicies);

module.exports = router;
