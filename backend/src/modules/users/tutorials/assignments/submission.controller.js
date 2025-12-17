const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const service = require("./submission.service");
const assignmentService = require("./tutorialAssignment.service");
const enrollmentService = require("../enrollments/tutorialEnrollment.service");
const { requireUser } = require("../utils");
const AppError = require("../../../../utils/AppError");
const {
  SUBMISSION_UPLOAD_SUBDIR,
} = require("../../../classes/assignments/submissionUpload.middleware");

exports.getMySubmission = catchAsync(async (req, res) => {
  const userId = requireUser(req);
  const submission = await service.getMySubmission(
    req.params.assignmentId,
    userId
  );
  sendSuccess(res, submission);
});

const buildUploadedFileUrl = (file) => {
  if (!file) return null;
  return `/uploads/${SUBMISSION_UPLOAD_SUBDIR}/${file.filename}`;
};

const normalizeTextAnswer = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

exports.createSubmission = catchAsync(async (req, res) => {
  const userId = requireUser(req);
  const assignment = await assignmentService.getById(req.params.assignmentId);

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  const enrollment = await enrollmentService.findEnrollment(
    userId,
    assignment.tutorial_id
  );

  if (!enrollment) {
    throw new AppError("Access denied", 403);
  }

  const payload = {
    file_url: buildUploadedFileUrl(req.file) || req.body.file_url || null,
    text_answer: normalizeTextAnswer(req.body.text_answer),
  };

  if (!payload.file_url && !payload.text_answer) {
    throw new AppError(
      "Please provide an answer or upload a file before submitting.",
      400
    );
  }

  const existing = await service.getMySubmission(
    assignment.id,
    userId
  );

  let submission;

  if (existing) {
    submission = await service.updateSubmission(existing.id, payload);
  } else {
    submission = await service.createSubmission({
      id: uuidv4(),
      assignment_id: req.params.assignmentId,
      user_id: userId,
      ...payload,
    });
  }

  await enrollmentService.recalculateProgress(
    userId,
    assignment.tutorial_id
  );

  sendSuccess(
    res,
    submission,
    existing ? "Submission updated" : "Submission created"
  );
});

exports.updateSubmission = catchAsync(async (req, res) => {
  const userId = requireUser(req);
  const existing = await service.getSubmissionById(req.params.submissionId);
  if (!existing) {
    throw new AppError("Submission not found", 404);
  }
  if (existing.user_id !== userId) {
    throw new AppError("Access denied", 403);
  }

  const update = {};
  if (req.body.file_url !== undefined) {
    update.file_url = req.body.file_url;
  }
  if (req.file) {
    update.file_url = buildUploadedFileUrl(req.file);
  }
  if (req.body.text_answer !== undefined) {
    update.text_answer = normalizeTextAnswer(req.body.text_answer);
  }

  if (!Object.keys(update).length) {
    throw new AppError("Nothing to update", 400);
  }

  const submission = await service.updateSubmission(
    req.params.submissionId,
    update
  );
  const assignment = await assignmentService.getById(submission.assignment_id);
  if (assignment) {
    await enrollmentService.recalculateProgress(
      userId,
      assignment.tutorial_id
    );
  }
  sendSuccess(res, submission, "Submission updated");
});
