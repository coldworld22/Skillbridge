const express = require("express");
const router = express.Router();
const controller = require("./tenantSubscriptions.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  requireRole,
} = require("../../middleware/tenant");

router.post("/replay", verifyToken, isAdmin, controller.replaySubscriptions);

router.post(
  "/stripe/checkout",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  requireRole(["tenant_admin", "saas_super_admin"]),
  controller.createStripeCheckout,
);

router.post(
  "/stripe/confirm",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  requireRole(["tenant_admin", "saas_super_admin"]),
  controller.confirmStripeCheckout,
);

module.exports = router;
