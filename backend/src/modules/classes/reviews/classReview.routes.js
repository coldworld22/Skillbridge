const router = require('express').Router();
const ctrl = require('./classReview.controller');
const { verifyToken, isStudent } = require('../../../middleware/auth/authMiddleware');

router.post('/:classId', verifyToken, isStudent, ctrl.submitReview);
router.get('/:classId', ctrl.getReviews);

module.exports = router;
