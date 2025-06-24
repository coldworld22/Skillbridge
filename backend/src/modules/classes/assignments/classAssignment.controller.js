const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classAssignment.service");

exports.getAssignmentsByClass = catchAsync(async (req, res) => {
  const assignments = await service.getByClass(req.params.classId);
  sendSuccess(res, assignments);
});

exports.createAssignment = catchAsync(async (req, res) => {
  const data = {
    ...req.body,
    id: uuidv4(),
    class_id: req.params.classId,
  };
  const assignment = await service.createAssignment(data);
  sendSuccess(res, assignment, "Assignment created");
});

exports.updateAssignment = catchAsync(async (req, res) => {
  const assignment = await service.updateAssignment(req.params.assignmentId, req.body);
  sendSuccess(res, assignment, "Assignment updated");
});

exports.deleteAssignment = catchAsync(async (req, res) => {
  await service.deleteAssignment(req.params.assignmentId);
  sendSuccess(res, null, "Assignment deleted");
});
