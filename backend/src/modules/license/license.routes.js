const express = require('express');
const router = express.Router();
const controller = require('./license.controller');
const validate = require('../../middleware/validate');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validator = require('./license.validator');

router.post('/activate', validate(validator.activate), controller.activateLicense);
router.post('/validate', validate(validator.validate), controller.validateLicense);
router.post('/deactivate', validate(validator.deactivate), controller.deactivateLicense);
router.get('/logs', verifyToken, isAdmin, controller.listLogs);
router.get('/status', verifyToken, isAdmin, controller.getStatus);

module.exports = router;
