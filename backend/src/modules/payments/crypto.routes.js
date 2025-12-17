const router = require('express').Router();
const controller = require('./crypto.controller');
const { verifyToken, isStudent } = require('../../middleware/auth/authMiddleware');

router.post('/ipn', controller.handleIPN);
router.post('/initiate', verifyToken, isStudent, controller.initiateCryptoPayment);
// Alias to support `/api/payments/nowpayments/create`
router.post('/create', verifyToken, isStudent, controller.initiateCryptoPayment);

module.exports = router;
