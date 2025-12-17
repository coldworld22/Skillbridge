const express = require("express");
const router = express.Router();
const controller = require("./moderation.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
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
  requireEntitlement("moderation.manage"),
);
router.get("/flags", controller.getFlags);
router.patch("/flags/:id", controller.updateFlag);

module.exports = router;
