const service = require("./instructorAdmin.service");
const { sendSuccess } = require("../../../../utils/response");
const catchAsync = require("../../../../utils/catchAsync");
const AppError = require("../../../../utils/AppError");

exports.getAll = catchAsync(async (_req, res) => {
  const instructors = await service.getAllInstructors();
  sendSuccess(res, instructors, "Instructors fetched");
});

exports.getById = catchAsync(async (req, res) => {
  const instructor = await service.getInstructorById(req.params.id);
  if (!instructor) throw new AppError("Instructor not found", 404);
  sendSuccess(res, instructor, "Instructor fetched");
});

exports.updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new AppError("Status required", 400);
  const updated = await service.updateInstructorStatus(req.params.id, status);
  sendSuccess(res, updated, "Status updated");
});

exports.deleteInstructor = catchAsync(async (req, res) => {
  await service.deleteInstructor(req.params.id);
  sendSuccess(res, null, "Instructor deleted");
});
