const express = require("express");
const router = express.Router();
const controller = require("./bank.controller");
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
  requireEntitlement("payment.manage"),
);

router.get("/", controller.getBankPayments);
router.post("/:id/approve", controller.approveBankPayment);
router.post("/:id/reject", controller.rejectBankPayment);

module.exports = router;
