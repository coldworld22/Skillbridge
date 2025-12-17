const router = require('express').Router();
const ctrl = require('./ai.controller');

router.post('/', ctrl.answer);

module.exports = router;
