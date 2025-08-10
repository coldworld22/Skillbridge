const router = require('express').Router();
const ctrl = require('./classNotification.controller');
const { verifyToken, isStudent } = require('../../../middleware/auth/authMiddleware');

router.post('/:classId', verifyToken, isStudent, ctrl.subscribe);

module.exports = router;
