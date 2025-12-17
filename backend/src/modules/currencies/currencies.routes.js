const router = require('express').Router();
const controller = require('./currencies.controller');
const upload = require('./currencyLogoUploadMiddleware');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');

router.get('/', controller.listCurrencies);
router.post('/', verifyToken, isAdmin, upload.single('logo'), controller.createCurrency);
router.put('/:id', verifyToken, isAdmin, upload.single('logo'), controller.updateCurrency);
router.delete('/:id', verifyToken, isAdmin, controller.deleteCurrency);

module.exports = router;
