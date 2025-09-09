const express = require('express');
const router = express.Router();

// Authentication and user related routes
router.use('/api/auth', require('../modules/auth/routes/auth.routes'));
router.use('/api/users', require('../modules/users/user.routes'));
router.use('/api/verify', require('../modules/verify/verify.routes'));
router.use('/api/license', require('../modules/license/license.routes'));
router.use('/api/certificates', require('../modules/users/tutorials/certificate/certificatePublic.routes'));
router.use('/api/certificates/admin', require('../modules/users/tutorials/certificate/certificateAdmin.routes'));
router.use('/api/certificate-templates', require('../modules/certificateTemplates/certificateTemplates.routes'));
router.use('/api/roles', require('../modules/roles/roles.routes'));
router.use('/api/plans', require('../modules/plans/plans.routes'));
router.use('/api/user-subscriptions', require('../modules/subscriptions/subscriptions.routes'));

module.exports = router;
