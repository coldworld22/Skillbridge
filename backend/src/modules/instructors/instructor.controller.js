const service = require("./instructor.service");
const { sendSuccess } = require("../../utils/response");
const catchAsync = require("../../utils/catchAsync");

exports.list = catchAsync(async (_req, res) => {
  const data = await service.getPublicInstructors();
  sendSuccess(res, data, "Instructors fetched");
});

exports.getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const instructor = await service.getPublicInstructor(id);
  if (!instructor) {
    return res.status(404).json({ message: "Instructor not found" });
  }
  sendSuccess(res, instructor);
});

exports.getAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const availability = await service.getInstructorAvailability(id);
  sendSuccess(res, availability);
});
