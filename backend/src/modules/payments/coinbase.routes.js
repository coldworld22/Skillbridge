const router = require('express').Router();
const controller = require('./coinbase.controller');
const { verifyToken, isStudent } = require('../../middleware/auth/authMiddleware');
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require('../../middleware/tenant');

router.post('/webhook', controller.handleWebhook);
router.post(
  '/initiate',
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement('payment.pay'),
  isStudent,
  controller.initiateCoinbasePayment,
);
// Alias support for '/create'
router.post(
  '/create',
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement('payment.pay'),
  isStudent,
  controller.initiateCoinbasePayment,
);

module.exports = router;
