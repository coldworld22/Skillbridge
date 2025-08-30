const logger = require('../../../../utils/logger.js');
const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../../../../utils/catchAsync');
const { sendSuccess } = require('../../../../utils/response');
const service = require('./tutorialAssignment.service');
const tutorialService = require('../tutorial.service');
const enrollmentService = require('../enrollments/tutorialEnrollment.service');
const notificationService = require('../../../notifications/notifications.service');
const smsService = require('../../../../services/smsService');
const { sendAssignmentEmail } = require('../../../../utils/email');
const { requireValidTutorialId } = require('../utils');

exports.getAssignmentsByTutorial = catchAsync(async (req, res) => {
  const tutorialId = requireValidTutorialId(req);
  const assignments = await service.getByTutorial(tutorialId);
  sendSuccess(res, assignments);
});

exports.createAssignment = catchAsync(async (req, res) => {
  const tutorialId = requireValidTutorialId(req);
  const data = {
    ...req.body,
    id: uuidv4(),
    tutorial_id: tutorialId,
  };
  const assignment = await service.createAssignment(data);

  try {
    const tutorial = await tutorialService.getTutorialById(tutorialId);
    const students = await enrollmentService.getByTutorial(tutorialId);
    if (tutorial && students.length) {
      const message = `New assignment "${assignment.title}" posted for tutorial "${tutorial.title}".`;
      await Promise.all(
        students.map((s) =>
          notificationService.createNotification({
            user_id: s.id,
            type: 'new_assignment',
            message,
          })
        )
      );
      await Promise.all(
        students.map(async (s) => {
          try {
            if (s.email) {
              await sendAssignmentEmail(s.email, assignment.title, tutorial.title, assignment.due_date);
            }
            if (s.phone) {
              await smsService.sendSMS({ to: s.phone, text: message });
            }
          } catch (err) {
            logger.error('Error sending assignment email/SMS:', err.message);
          }
        })
      );
    }
  } catch (err) {
    logger.error('Error sending assignment notifications:', err.message);
  }

  sendSuccess(res, assignment, 'Assignment created');
});

exports.updateAssignment = catchAsync(async (req, res) => {
  const assignment = await service.updateAssignment(req.params.assignmentId, req.body);
  sendSuccess(res, assignment, 'Assignment updated');
});

exports.deleteAssignment = catchAsync(async (req, res) => {
  await service.deleteAssignment(req.params.assignmentId);
  sendSuccess(res, null, 'Assignment deleted');
});

exports.getAllAssignments = catchAsync(async (_req, res) => {
  const assignments = await service.getAllAssignments();
  sendSuccess(res, assignments);
});
