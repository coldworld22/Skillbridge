const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const service = require("./submission.service");
const assignmentService = require("./tutorialAssignment.service");
const enrollmentService = require("../enrollments/tutorialEnrollment.service");

exports.getMySubmission = catchAsync(async (req, res) => {
  const submission = await service.getMySubmission(
    req.params.assignmentId,
    req.user.id
  );
  sendSuccess(res, submission);
});

exports.createSubmission = catchAsync(async (req, res) => {
  const data = {
    ...req.body,
    id: uuidv4(),
    assignment_id: req.params.assignmentId,
    user_id: req.user.id,
  };
  const submission = await service.createSubmission(data);
  const assignment = await assignmentService.getById(req.params.assignmentId);
  if (assignment)
    await enrollmentService.recalculateProgress(
      req.user.id,
      assignment.tutorial_id
    );
  sendSuccess(res, submission, "Submission created");
});

exports.updateSubmission = catchAsync(async (req, res) => {
  const submission = await service.updateSubmission(
    req.params.submissionId,
    req.body
  );
  const assignment = await assignmentService.getById(submission.assignment_id);
  if (assignment)
    await enrollmentService.recalculateProgress(
      req.user.id,
      assignment.tutorial_id
    );
  sendSuccess(res, submission, "Submission updated");
});
