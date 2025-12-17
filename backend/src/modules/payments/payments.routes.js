const express = require("express");
const router = express.Router();
const controller = require("./payments.controller");
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

router.post("/", controller.createPayment);
router.get("/", controller.getPayments);
router.get("/:id", controller.getPayment);
router.patch("/:id", controller.updatePayment);
router.delete("/:id", controller.deletePayment);

module.exports = router;
