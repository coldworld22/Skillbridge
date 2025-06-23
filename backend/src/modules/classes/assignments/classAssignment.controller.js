const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classAssignment.service");

exports.getAssignmentsByClass = catchAsync(async (req, res) => {
  const assignments = await service.getByClass(req.params.classId);
  sendSuccess(res, assignments);
});
