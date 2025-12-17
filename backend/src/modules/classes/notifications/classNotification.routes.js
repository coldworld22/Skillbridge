const router = require('express').Router();
const ctrl = require('./classNotification.controller');
const {
  verifyToken,
  isStudent,
} = require('../../../middleware/auth/authMiddleware');
const verifyEnrollment = require('../../../middleware/auth/verifyEnrollment');

router.post('/:classId', verifyToken, isStudent, verifyEnrollment, ctrl.subscribe);

module.exports = router;
