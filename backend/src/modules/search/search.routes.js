const router = require('express').Router();
const controller = require('./search.controller');
const { resolveTenant } = require('../../middleware/tenant');

router.get('/', resolveTenant, controller.search);

module.exports = router;
