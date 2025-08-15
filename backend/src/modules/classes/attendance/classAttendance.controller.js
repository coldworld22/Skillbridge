const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classAttendance.service");

exports.listByClass = catchAsync(async (req, res) => {
  const data = await service.getByClass(req.params.lessonId);
  sendSuccess(res, data);
});

exports.updateAttendance = catchAsync(async (req, res) => {
  const { lessonId, userId } = req.params;
  const { attended } = req.body;
  const row = await service.setAttendance(lessonId, userId, attended);
  sendSuccess(res, row, "Attendance updated");
});
