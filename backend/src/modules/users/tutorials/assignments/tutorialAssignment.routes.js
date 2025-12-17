const router = require('express').Router();
const ctrl = require('./tutorialAssignment.controller');
const { verifyToken, isInstructorOrAdmin } = require('../../../../middleware/auth/authMiddleware');
const verifyTutorialAccess = require('../../../../middleware/auth/verifyTutorialAccess');
const validate = require('../../../../middleware/validate');
const validator = require('./tutorialAssignment.validator');

router.get('/admin', verifyToken, isInstructorOrAdmin, ctrl.getAllAssignments);
router.get('/item/:assignmentId', verifyToken, ctrl.getAssignmentDetails);
router.get('/:tutorialId', verifyToken, verifyTutorialAccess, ctrl.getAssignmentsByTutorial);
router.post(
  '/:tutorialId',
  verifyToken,
  verifyTutorialAccess,
  isInstructorOrAdmin,
  validate(validator.create),
  ctrl.createAssignment
);
router.put('/:assignmentId', verifyToken, isInstructorOrAdmin, validate(validator.update), ctrl.updateAssignment);
router.delete('/:assignmentId', verifyToken, isInstructorOrAdmin, ctrl.deleteAssignment);

module.exports = router;
