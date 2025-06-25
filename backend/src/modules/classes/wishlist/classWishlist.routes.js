const router = require('express').Router();
const ctrl = require('./classWishlist.controller');
const { verifyToken, isStudent } = require('../../../middleware/auth/authMiddleware');

router.get('/my', verifyToken, isStudent, ctrl.listMine);
router.post('/:classId', verifyToken, isStudent, ctrl.add);
router.delete('/:classId', verifyToken, isStudent, ctrl.remove);

module.exports = router;
