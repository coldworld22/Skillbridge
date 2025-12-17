const express = require("express");
const router = express.Router();
const controller = require("./emailConfig.controller");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");

router.get("/", controller.getSettings);
router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("config.email.manage"),
  isAdmin,
);
router.put("/", controller.updateSettings);

module.exports = router;
