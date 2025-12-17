const router = require('express').Router();
const ctrl = require('./classScore.controller');
const {
  verifyToken,
  isInstructorOrAdmin,
  isStudent,
} = require('../../../middleware/auth/authMiddleware');
const verifyClassOwnership = require('../../../middleware/auth/verifyClassOwnership');
const verifyEnrollment = require('../../../middleware/auth/verifyEnrollment');

router.post(
  '/policy/:classId',
  verifyToken,
  isInstructorOrAdmin,
  verifyClassOwnership,
  ctrl.setPolicy
);
router.get(
  '/instructor/:classId',
  verifyToken,
  isInstructorOrAdmin,
  verifyClassOwnership,
  ctrl.listScores
);
router.post(
  '/instructor/:classId/students/:studentId/issue',
  verifyToken,
  isInstructorOrAdmin,
  verifyClassOwnership,
  ctrl.issueCertificate
);
router.get(
  '/student/:classId',
  verifyToken,
  isStudent,
  verifyEnrollment,
  ctrl.getMyScore
);

module.exports = router;
