const router = require('express').Router();
const controller = require('./cart.controller');

router.post('/add', controller.addItem);
router.get('/', controller.getItems);
router.put('/update/:id', controller.updateItem);
router.delete('/remove/:id', controller.removeItem);

module.exports = router;
