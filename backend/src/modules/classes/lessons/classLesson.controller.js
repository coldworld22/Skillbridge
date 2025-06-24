const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classLesson.service");

exports.getLessonsByClass = catchAsync(async (req, res) => {
  const lessons = await service.getByClass(req.params.classId);
  sendSuccess(res, lessons);
});

exports.createLesson = catchAsync(async (req, res) => {
  const data = {
    ...req.body,
    id: uuidv4(),
    class_id: req.params.classId,
  };
  const lesson = await service.createLesson(data);
  sendSuccess(res, lesson, "Lesson created");
});

exports.updateLesson = catchAsync(async (req, res) => {
  const lesson = await service.updateLesson(req.params.lessonId, req.body);
  sendSuccess(res, lesson, "Lesson updated");
});

exports.deleteLesson = catchAsync(async (req, res) => {
  await service.deleteLesson(req.params.lessonId);
  sendSuccess(res, null, "Lesson deleted");
});
