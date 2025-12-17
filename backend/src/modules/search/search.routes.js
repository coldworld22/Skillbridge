const router = require('express').Router();
const controller = require('./search.controller');

router.get('/', controller.search);

module.exports = router;
