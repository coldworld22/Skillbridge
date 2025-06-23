const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classLesson.service");

exports.getLessonsByClass = catchAsync(async (req, res) => {
  const lessons = await service.getByClass(req.params.classId);
  sendSuccess(res, lessons);
});
