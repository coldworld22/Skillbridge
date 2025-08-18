const router = require('express').Router();
const controller = require('./bookReview.controller');
const { verifyToken } = require('../../middleware/auth/authMiddleware');

router.get('/books/:bookId', controller.listReviews);
router.post('/', verifyToken, controller.createReview);
router.put('/:id', verifyToken, controller.updateReview);
router.delete('/:id', verifyToken, controller.deleteReview);

module.exports = router;
