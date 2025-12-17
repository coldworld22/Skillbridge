const express = require("express");
const router = express.Router();
const controller = require("./adsense.controller");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");

router.get("/", controller.getConfig);
router.post(
  "/config",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("config.adsense.manage"),
  isAdmin,
  controller.saveConfig,
);

module.exports = router;
