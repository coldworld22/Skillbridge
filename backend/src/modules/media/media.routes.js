const router = require("express").Router();
const controller = require("./media.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  requireEntitlement,
} = require("../../middleware/tenant");

router.get(
  "/*",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  requireEntitlement("media.stream"),
  controller.stream,
);

module.exports = router;
