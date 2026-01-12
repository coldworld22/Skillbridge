const router = require('express').Router();
const controller = require('./coinbase.controller');
const { verifyToken, isStudent } = require('../../middleware/auth/authMiddleware');

router.post('/webhook', controller.handleWebhook);
router.post('/initiate', verifyToken, isStudent, controller.initiateCoinbasePayment);
// Alias support for '/create'
router.post('/create', verifyToken, isStudent, controller.initiateCoinbasePayment);

module.exports = router;
