// Controller for class enrollment operations
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const AppError = require("../../../utils/AppError");
const service = require("./classEnrollment.service");
const classService = require("../class.service");

exports.enroll = catchAsync(async (req, res) => {
  const { classId } = req.params;
  const user_id = req.user.id;
  const cls = await classService.getClassById(classId);
  if (!cls) throw new AppError("Class not found", 404);
  if (cls.status !== "published" || cls.moderation_status !== "Approved") {
    throw new AppError("Class is not available for enrollment", 400);
  }
  if (typeof cls.max_students === "number" && cls.max_students !== null) {
    const count = await service.countEnrollments(classId);
    if (count >= cls.max_students) {
      throw new AppError("Class is full", 400);
    }
  }
  const exists = await service.findEnrollment(user_id, classId);
  if (exists) return sendSuccess(res, exists, "Already enrolled");

  const data = { id: uuidv4(), user_id, class_id: classId, status: "enrolled" };
  await service.createEnrollment(data);
  sendSuccess(res, data, "Enrolled successfully");
});

exports.complete = catchAsync(async (req, res) => {
  const { classId } = req.params;
  await service.markCompleted(req.user.id, classId);
  sendSuccess(res, null, "Marked as completed");
});

exports.getMyEnrollments = catchAsync(async (req, res) => {
  const data = await service.getByUser(req.user.id);
  sendSuccess(res, data);
});

exports.getStudentsByClass = catchAsync(async (req, res) => {
  const data = await service.getByClass(req.params.id);
  sendSuccess(res, data);
});

exports.getStudent = catchAsync(async (req, res) => {
  const { classId, studentId } = req.params;
  const data = await service.getStudent(classId, studentId);
  sendSuccess(res, data);
});
