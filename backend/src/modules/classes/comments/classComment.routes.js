const router = require('express').Router();
const ctrl = require('./classComment.controller');
const { verifyToken } = require('../../../middleware/auth/authMiddleware');
const verifyClassAccess = require('../../../middleware/auth/verifyClassAccess');

router.post('/:classId', verifyToken, verifyClassAccess, ctrl.createComment);
router.get('/:classId', ctrl.getComments);

module.exports = router;
