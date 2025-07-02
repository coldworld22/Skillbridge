const service = require("./student.service");
const { sendSuccess } = require("../../utils/response");

exports.list = async (_req, res) => {
  const data = await service.getPublicStudents();
  sendSuccess(res, data, "Students fetched");
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const student = await service.getPublicStudent(id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  sendSuccess(res, student);
};
