const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../../../../utils/catchAsync');
const { sendSuccess } = require('../../../../utils/response');
const service = require('./tutorialAssignment.service');

exports.getAssignmentsByTutorial = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
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
