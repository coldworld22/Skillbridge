const service = require("./instructor.service");
const { sendSuccess } = require("../../utils/response");

exports.list = async (_req, res, next) => {
  const data = await service.getPublicInstructors();
  sendSuccess(res, data, "Instructors fetched");
};

exports.getById = async (req, res, next) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const instructor = await service.getPublicInstructor(id);
  if (!instructor) {
    return res.status(404).json({ message: "Instructor not found" });
  }
  sendSuccess(res, instructor);
};

exports.getAvailability = async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const availability = await service.getInstructorAvailability(id);
  sendSuccess(res, availability);
};
