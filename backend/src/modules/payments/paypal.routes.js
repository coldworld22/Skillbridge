const router = require('express').Router();
const controller = require('./paypal.controller');
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
  controller.createPayPalPayment,
);
router.get('/callback', resolveTenant, controller.handlePayPalCallback);

module.exports = router;
