const router = require('express').Router();
const ctrl = require('./classComment.controller');
const { verifyToken, isStudent } = require('../../../middleware/auth/authMiddleware');

router.post('/:classId', verifyToken, isStudent, ctrl.createComment);
router.get('/:classId', ctrl.getComments);

module.exports = router;
