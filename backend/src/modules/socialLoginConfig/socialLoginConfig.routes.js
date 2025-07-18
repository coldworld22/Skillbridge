const express = require("express");
const router = express.Router();
const controller = require("./socialLoginConfig.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

// Middleware that verifies the user when secrets are requested
const maybeAuth = (req, res, next) => {
  if (req.query.includeSecrets) {
    return verifyToken(req, res, (err) => {
      if (err) return;
      return isAdmin(req, res, next);
    });
  }
  next();
};

// Log incoming GET requests to debug potential auth or DB issues
router.get("/", maybeAuth, (req, res, next) => {
  console.log("[socialLoginConfig] GET /api/social-login/config", {
    user: req.user,
    includeSecrets: req.query.includeSecrets,
  });
  controller.getSettings(req, res, next);
});
router.use(verifyToken, isAdmin);
router.put("/", controller.updateSettings);

module.exports = router;
