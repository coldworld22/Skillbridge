const express = require("express");
const router = express.Router();
const controller = require("./messagesConfig.controller");
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

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("config.messages.manage"),
  isAdmin,
);

router.get("/", controller.getSettings);
router.put("/", controller.updateSettings);

module.exports = router;
