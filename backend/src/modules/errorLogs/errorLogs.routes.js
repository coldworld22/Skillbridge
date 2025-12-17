const router = require('express').Router();
const controller = require('./errorLogs.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');

router.use(verifyToken, isAdmin);
router.get('/', controller.list);

module.exports = router;
