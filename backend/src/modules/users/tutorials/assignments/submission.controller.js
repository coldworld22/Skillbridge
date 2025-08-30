const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const service = require("./submission.service");
const assignmentService = require("./tutorialAssignment.service");
const enrollmentService = require("../enrollments/tutorialEnrollment.service");
const { requireUser } = require("../utils");

exports.getMySubmission = catchAsync(async (req, res) => {
  const userId = requireUser(req);
  const submission = await service.getMySubmission(
    req.params.assignmentId,
    userId
  );
  sendSuccess(res, submission);
});

exports.createSubmission = catchAsync(async (req, res) => {
  const userId = requireUser(req);
  const data = {
    ...req.body,
    id: uuidv4(),
    assignment_id: req.params.assignmentId,
    user_id: userId,
  };
  const submission = await service.createSubmission(data);
  const assignment = await assignmentService.getById(req.params.assignmentId);
  if (assignment)
    await enrollmentService.recalculateProgress(
      userId,
      assignment.tutorial_id
    );
  sendSuccess(res, submission, "Submission created");
});

exports.updateSubmission = catchAsync(async (req, res) => {
  const userId = requireUser(req);
  const submission = await service.updateSubmission(
    req.params.submissionId,
    req.body
  );
  const assignment = await assignmentService.getById(submission.assignment_id);
  if (assignment)
    await enrollmentService.recalculateProgress(
      userId,
      assignment.tutorial_id
    );
  sendSuccess(res, submission, "Submission updated");
});
