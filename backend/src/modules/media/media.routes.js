const router = require('express').Router();
const controller = require('./media.controller');

router.get('/*', controller.stream);

module.exports = router;
