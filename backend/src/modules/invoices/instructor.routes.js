const router = require("express").Router();
const controller = require("./invoices.controller");
const { verifyToken, isInstructor } = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
} = require("../../middleware/tenant");

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructor,
);

router.get("/", controller.getMyInvoices);
router.get("/payment/:paymentId", controller.getMyInvoiceByPaymentId);
router.get("/:id/download", controller.downloadInvoice);
router.get("/:id", controller.getMyInvoice);

module.exports = router;
