const logger = require('../../../utils/logger.js');
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const AppError = require("../../../utils/AppError");
const service = require("./classAssignment.service");
const classService = require("../class.service");
const enrollmentService = require("../enrollments/classEnrollment.service");
const notificationService = require("../../notifications/notifications.service");
const smsService = require("../../../services/smsService");
const { sendAssignmentEmail } = require("../../../utils/email");
const submissionService = require("./submission.service");
const { isAdminRole } = require("../../../utils/role");

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

exports.getAssignment = catchAsync(async (req, res) => {
  const assignment = await service.getAssignmentWithClass(
    req.params.assignmentId
  );

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  const roles = req.user.roles || [req.user.role];
  const isAdmin = isAdminRole(roles);
  const isInstructor = assignment.instructor_id === req.user.id;
  let isStudent = false;

  if (!isInstructor && !isAdmin) {
    const enrollment = await enrollmentService.findEnrollment(
      req.user.id,
      assignment.class_id
    );
    if (!enrollment || enrollment.status === "cancelled") {
      throw new AppError("Access denied", 403);
    }
    if (enrollment.status === "suspended") {
      throw new AppError(
        "Enrollment suspended pending installment payment",
        403
      );
    }
    isStudent = true;
  }

  if (!isInstructor && !isStudent && !isAdmin) {
    throw new AppError("Access denied", 403);
  }

  const submission = await submissionService.getSubmissionForUser(
    assignment.id,
    req.user.id
  );

  sendSuccess(res, {
    source: "class",
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      class_id: assignment.class_id,
      class_title: assignment.class_title,
      class_description: assignment.class_description,
      class_cover_image: assignment.class_cover_image,
      instructor_id: assignment.instructor_id,
      instructor_name: assignment.instructor_name,
    },
    submission: formatSubmission(submission),
  });
});

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

  try {
    const cls = await classService.getClassById(req.params.classId);
    const students = await enrollmentService.getByClass(req.params.classId);
    if (cls && students.length) {
      const message = `New assignment "${assignment.title}" posted for class "${cls.title}".`;
      await Promise.all(
        students.map((s) =>
          notificationService.createNotification({
            user_id: s.id,
            type: "new_assignment",
            message,
          })
        )
      );
      await Promise.all(
        students.map(async (s) => {
          try {
            if (s.email) {
              await sendAssignmentEmail(
                s.email,
                assignment.title,
                cls.title,
                assignment.due_date
              );
            }
            if (s.phone) {
              await smsService.sendSMS({ to: s.phone, text: message });
            }
          } catch (err) {
            logger.error("Error sending assignment email/SMS:", err.message);
          }
        })
      );
    }
  } catch (err) {
    logger.error("Error sending assignment notifications:", err.message);
  }

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

exports.getAllAssignments = catchAsync(async (_req, res) => {
  const assignments = await service.getAllAssignments();
  sendSuccess(res, assignments);
});
