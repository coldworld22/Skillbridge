const router = require('express').Router();
const controller = require('./install.controller');

router.get('/prereqs', controller.checkPrereqs);
router.post('/run', controller.runInstall);

module.exports = router;
