const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classLesson.service");
const classService = require("../class.service");
const AppError = require("../../../utils/AppError");

exports.getLessonsByClass = catchAsync(async (req, res) => {
  const lessons = await service.getByClass(req.params.classId);
  sendSuccess(res, lessons);
});

exports.createLesson = catchAsync(async (req, res) => {
  const cls = await classService.getClassById(req.params.classId);
  if (!cls) throw new AppError("Class not found", 404);
  if (!req.body.start_time) throw new AppError("start_time is required", 400);
  const start = new Date(req.body.start_time);
  if (
    (cls.start_date && start < new Date(cls.start_date)) ||
    (cls.end_date && start > new Date(cls.end_date))
  ) {
    throw new AppError("Lesson start_time must be within class date range", 400);
  }
  const data = {
    ...req.body,
    id: uuidv4(),
    class_id: req.params.classId,
  };
  const lesson = await service.createLesson(data);
  sendSuccess(res, lesson, "Lesson created");
});

exports.updateLesson = catchAsync(async (req, res) => {
  if (req.body.start_time) {
    const existing = await service.getById(req.params.lessonId);
    const cls = await classService.getClassById(existing.class_id);
    const start = new Date(req.body.start_time);
    if (
      (cls.start_date && start < new Date(cls.start_date)) ||
      (cls.end_date && start > new Date(cls.end_date))
    ) {
      throw new AppError("Lesson start_time must be within class date range", 400);
    }
  }
  const lesson = await service.updateLesson(req.params.lessonId, req.body);
  sendSuccess(res, lesson, "Lesson updated");
});

exports.deleteLesson = catchAsync(async (req, res) => {
  await service.deleteLesson(req.params.lessonId);
  sendSuccess(res, null, "Lesson deleted");
});
