const router = require('express').Router();
const controller = require('./paypal.controller');
const { verifyToken, isStudent } = require('../../middleware/auth/authMiddleware');

router.post('/create', verifyToken, isStudent, controller.createPayPalPayment);
router.get('/callback', controller.handlePayPalCallback);

module.exports = router;
