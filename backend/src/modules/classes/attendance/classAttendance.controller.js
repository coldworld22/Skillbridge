const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classAttendance.service");

exports.listByClass = catchAsync(async (req, res) => {
  const data = await service.getByClass(req.params.classId);
  sendSuccess(res, data);
});

exports.updateAttendance = catchAsync(async (req, res) => {
  const { classId, userId } = req.params;
  const { attended } = req.body;
  const row = await service.setAttendance(classId, userId, attended);
  sendSuccess(res, row, "Attendance updated");
});
