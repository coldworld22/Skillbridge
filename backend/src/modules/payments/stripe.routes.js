const router = require('express').Router();
const controller = require('./stripe.controller');
const { verifyToken, isStudent } = require('../../middleware/auth/authMiddleware');

router.post('/create', verifyToken, isStudent, controller.createStripePayment);

module.exports = router;
