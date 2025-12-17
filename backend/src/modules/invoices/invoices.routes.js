const router = require("express").Router();
const controller = require("./invoices.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
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
  requireEntitlement("payment.manage"),
  isAdmin,
);

router.get("/", controller.getInvoices);
router.get("/:id", controller.getInvoice);
router.get("/:id/download", controller.downloadInvoice);

module.exports = router;
