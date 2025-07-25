const router = require('express').Router();
const controller = require('./media.controller');

router.get('/:filename', controller.stream);

module.exports = router;
