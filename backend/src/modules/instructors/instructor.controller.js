const service = require("./instructor.service");
const { sendSuccess } = require("../../utils/response");

exports.list = async (_req, res, next) => {
  const data = await service.getPublicInstructors();
  sendSuccess(res, data, "Instructors fetched");
};

exports.getById = async (req, res, next) => {
  const instructor = await service.getPublicInstructor(req.params.id);
  if (!instructor) {
    return res.status(404).json({ message: "Instructor not found" });
  }
  sendSuccess(res, instructor);
};

exports.getAvailability = async (req, res) => {
  const availability = await service.getInstructorAvailability(req.params.id);
  sendSuccess(res, availability);
};
