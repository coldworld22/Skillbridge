const router = require('express').Router();
const ctrl = require('./classScore.controller');
const { verifyToken, isInstructorOrAdmin, isStudent } = require('../../../middleware/auth/authMiddleware');

router.post('/policy/:classId', verifyToken, isInstructorOrAdmin, ctrl.setPolicy);
router.get('/instructor/:classId', verifyToken, isInstructorOrAdmin, ctrl.listScores);
router.post('/instructor/:classId/students/:studentId/issue', verifyToken, isInstructorOrAdmin, ctrl.issueCertificate);
router.get('/student/:classId', verifyToken, isStudent, ctrl.getMyScore);

module.exports = router;
