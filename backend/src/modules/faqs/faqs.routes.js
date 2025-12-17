const router = require('express').Router();
const controller = require('./faqs.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');

router.get('/', controller.listFaqs);
router.post('/', verifyToken, isAdmin, controller.createFaq);
router.put('/:id', verifyToken, isAdmin, controller.updateFaq);
router.delete('/:id', verifyToken, isAdmin, controller.deleteFaq);

module.exports = router;
