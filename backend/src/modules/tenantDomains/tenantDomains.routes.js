const router = require("express").Router();
const controller = require("./tenantDomains.controller");
const {
  verifyToken,
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
  requireEntitlement("tenant.domain.manage"),
);

router.get("/", controller.list);
router.post("/", controller.create);
router.post("/:id/verify", controller.verify);
router.delete("/:id", controller.remove);

module.exports = router;
