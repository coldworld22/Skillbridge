const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./submission.service");

exports.getByAssignment = catchAsync(async (req, res) => {
  const submissions = await service.getByAssignment(req.params.assignmentId);
  sendSuccess(res, submissions);
});

exports.createSubmission = catchAsync(async (req, res) => {
  const data = {
    ...req.body,
    id: uuidv4(),
    assignment_id: req.params.assignmentId,
    user_id: req.user.id,
  };
  const submission = await service.createSubmission(data);
  sendSuccess(res, submission, "Submission created");
});

exports.updateSubmission = catchAsync(async (req, res) => {
  const submission = await service.updateSubmission(
    req.params.submissionId,
    req.body
  );
  sendSuccess(res, submission, "Submission updated");
});

exports.deleteSubmission = catchAsync(async (req, res) => {
  await service.deleteSubmission(req.params.submissionId);
  sendSuccess(res, null, "Submission deleted");
});
