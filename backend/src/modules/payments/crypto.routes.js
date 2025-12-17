const router = require('express').Router();
const controller = require('./crypto.controller');
const { verifyToken, isStudent } = require('../../middleware/auth/authMiddleware');
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");

router.post('/ipn', resolveTenant, controller.handleIPN);
router.post(
  '/initiate',
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("payment.pay"),
  isStudent,
  controller.initiateCryptoPayment,
);
// Alias to support `/api/payments/nowpayments/create`
router.post(
  '/create',
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("payment.pay"),
  isStudent,
  controller.initiateCryptoPayment,
);

module.exports = router;
