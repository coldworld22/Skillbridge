const logger = require('../../../../utils/logger.js');
const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../../../../utils/catchAsync');
const { sendSuccess } = require('../../../../utils/response');
const AppError = require('../../../../utils/AppError');
const service = require('./tutorialAssignment.service');
const tutorialService = require('../tutorial.service');
const enrollmentService = require('../enrollments/tutorialEnrollment.service');
const notificationService = require('../../../notifications/notifications.service');
const smsService = require('../../../../services/smsService');
const { sendAssignmentEmail } = require('../../../../utils/email');
const { requireValidTutorialId } = require('../utils');
const submissionService = require('./submission.service');
const { isAdminRole } = require('../../../../utils/role');

const formatSubmission = (submission) => {
  if (!submission) return null;
  return {
    id: submission.id,
    file_url: submission.file_url,
    text_answer: submission.text_answer,
    grade: submission.grade,
    created_at: submission.created_at,
    updated_at: submission.updated_at,
  };
};

exports.getAssignmentDetails = catchAsync(async (req, res) => {
  const assignment = await service.getAssignmentWithTutorial(
    req.params.assignmentId
  );
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  const roles = req.user.roles || [req.user.role];
  const isAdmin = isAdminRole(roles);
  const isInstructor = assignment.instructor_id === req.user.id;
  let isStudent = false;

  if (!isInstructor && !isAdmin) {
    const enrollment = await enrollmentService.findEnrollment(
      req.user.id,
      assignment.tutorial_id
    );
    if (!enrollment) {
      throw new AppError('Access denied', 403);
    }
    isStudent = true;
  }

  if (!isInstructor && !isStudent && !isAdmin) {
    throw new AppError('Access denied', 403);
  }

  const submission = await submissionService.getMySubmission(
    assignment.id,
    req.user.id
  );

  sendSuccess(res, {
    source: 'tutorial',
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      tutorial_id: assignment.tutorial_id,
      tutorial_title: assignment.tutorial_title,
      tutorial_description: assignment.tutorial_description,
      tutorial_cover_image: assignment.tutorial_cover_image,
      instructor_id: assignment.instructor_id,
      instructor_name: assignment.instructor_name,
    },
    submission: formatSubmission(submission),
  });
});

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
