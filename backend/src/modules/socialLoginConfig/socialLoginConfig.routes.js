const express = require("express");
const router = express.Router();
const controller = require("./socialLoginConfig.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

// Log incoming GET requests to debug potential auth or DB issues
router.get("/", (req, res, next) => {
  console.log("[socialLoginConfig] GET /api/social-login/config", {
    user: req.user,
    authHeader: req.headers.authorization,
  });
  controller.getSettings(req, res, next);
});
router.use(verifyToken, isAdmin);
router.put("/", controller.updateSettings);

module.exports = router;
