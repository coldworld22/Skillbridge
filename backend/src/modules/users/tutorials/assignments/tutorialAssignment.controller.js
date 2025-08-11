const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../../../../utils/catchAsync');
const { sendSuccess } = require('../../../../utils/response');
const AppError = require('../../../../utils/AppError');
const db = require('../../../../config/database');
const service = require('./tutorialAssignment.service');

exports.getAssignmentsByTutorial = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const userId = req.user.id;

  // Fetch tutorial to confirm ownership/instructor
  const tutorial = await db('tutorials')
    .select('instructor_id')
    .where({ id: tutorialId })
    .first();

  if (!tutorial) throw new AppError('Tutorial not found', 404);

  const roles = req.user.roles || [req.user.role];
  const normalized = roles.map((r) => r.toLowerCase().replace(/\s+/g, ''));
  const isAdmin = normalized.some((r) => ['admin', 'superadmin'].includes(r));
  const isInstructor = normalized.includes('instructor') && tutorial.instructor_id === userId;

  if (!isAdmin && !isInstructor) {
    const enrolled = await db('tutorial_enrollments')
      .where({ tutorial_id: tutorialId, user_id: userId })
      .first();
    if (!enrolled) throw new AppError('Access denied', 403);
  }

  const assignments = await service.getByTutorial(tutorialId);
  sendSuccess(res, assignments);
});

exports.createAssignment = catchAsync(async (req, res) => {
  const data = {
    ...req.body,
    id: uuidv4(),
    tutorial_id: req.params.tutorialId,
  };
  const assignment = await service.createAssignment(data);
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
