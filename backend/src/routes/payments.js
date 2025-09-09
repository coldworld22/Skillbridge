const express = require('express');
const router = express.Router();

// Payment related routes
// Register admin payment-methods before public routes
router.use('/api/payment-methods/admin', require('../modules/paymentMethods/paymentMethods.routes'));
router.use('/api/payment-methods', require('../modules/paymentMethods/paymentMethods.public.routes'));
router.use('/api/payments/student', require('../modules/payments/student.routes'));
router.use('/api/payments/bank', require('../modules/payments/bank.routes'));
router.use('/api/payments/crypto', require('../modules/payments/crypto.routes'));
router.use('/api/payments/coinbase', require('../modules/payments/coinbase.routes'));
// Alias for NOWPayments crypto gateway
router.use('/api/payments/nowpayments', require('../modules/payments/crypto.routes'));
// PayPal order creation and callback
router.use('/api/payments/paypal', require('../modules/payments/paypal.routes'));
router.use('/api/payments/stripe', require('../modules/payments/stripe.routes'));
router.use('/api/payments/admin', require('../modules/payments/payments.routes'));
router.use('/api/invoices/admin', require('../modules/invoices/invoices.routes'));
router.use('/api/invoices/student', require('../modules/invoices/student.routes'));
router.use('/api/invoices/instructor', require('../modules/invoices/instructor.routes'));
router.use('/api/admin/payments/bank', require('../modules/payments/bank.admin.routes'));
router.use('/api/payments/config', require('../modules/paymentConfig/paymentConfig.routes'));
router.use('/api/payouts', require('../modules/payouts/payouts.routes'));

module.exports = router;
