const router = require('express').Router();
const controller = require('./stripe.controller');
const { verifyToken, isStudent } = require('../../middleware/auth/authMiddleware');
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");

router.post(
  '/create',
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("payment.pay"),
  isStudent,
  controller.createStripePayment,
);

module.exports = router;
