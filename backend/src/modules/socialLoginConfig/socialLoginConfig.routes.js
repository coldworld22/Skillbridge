const express = require("express");
const router = express.Router();
const controller = require("./socialLoginConfig.controller");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");
const logger = require("../../utils/logger");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");

// Middleware that verifies the user when secrets are requested
const maybeAuth = (req, res, next) => {
  if (req.query.includeSecrets) {
    return verifyToken(req, res, (err) => {
      if (err) {
        return next(err);
      }
      return isAdmin(req, res, next);
    });
  }
  next();
};

// Log incoming GET requests to debug potential auth or DB issues
router.get("/", maybeAuth, (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    logger.debug(
      "[socialLoginConfig] GET /api/social-login/config",
      JSON.stringify({
        userId: req.user ? req.user.id : null,
        includeSecrets: !!req.query.includeSecrets,
      }),
    );
  }
  controller.getSettings(req, res, next);
});
router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("config.social.manage"),
  isAdmin,
);
router.put("/", controller.updateSettings);

module.exports = router;
