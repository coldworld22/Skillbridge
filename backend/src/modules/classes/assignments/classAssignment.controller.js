const logger = require('../../../utils/logger.js');
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classAssignment.service");
const classService = require("../class.service");
const enrollmentService = require("../enrollments/classEnrollment.service");
const notificationService = require("../../notifications/notifications.service");
const smsService = require("../../../services/smsService");
const { sendAssignmentEmail } = require("../../../utils/email");

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
