const express = require("express");
const router = express.Router();
const controller = require("./contactConfig.controller");
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
  requireEntitlement("config.contact.manage"),
  isAdmin,
);
router.put("/", controller.updateSettings);

module.exports = router;
