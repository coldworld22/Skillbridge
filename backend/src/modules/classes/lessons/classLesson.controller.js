const logger = require('../../../utils/logger.js');
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classLesson.service");
const classService = require("../class.service");
const AppError = require("../../../utils/AppError");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const userModel = require("../../users/user.model");
const { sendLessonScheduledEmail } = require("../../../utils/email");
const fs = require("fs");
const path = require("path");

const normalizeDuration = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};


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
  const normalizedDuration = normalizeDuration(
    req.body.duration ?? req.body.duration_minutes,
  );
  if (normalizedDuration !== undefined) {
    data.duration = normalizedDuration;
  }
  delete data.duration_minutes;
  if (req.file) {
    data.topic_file_url = `/uploads/lessons/${req.file.filename}`;
  }
  const lesson = await service.createLesson(data);
  const message = `Lesson "${lesson.title}" scheduled for ${lesson.start_time}`;
  await notificationService.createNotification({
    user_id: cls.instructor_id,
    type: "lesson_scheduled",
    message,
  });
  const admins = await userModel.findAdmins();
  const sender = admins[0];
  if (sender) {
    await messageService.createMessage({
      sender_id: sender.id,
      receiver_id: cls.instructor_id,
      message,
    });
  }
  try {
    const instructor = await userModel.findById(cls.instructor_id);
    if (instructor) {
      await sendLessonScheduledEmail(
        instructor.email,
        lesson.title,
        lesson.start_time,
        cls.title
      );
    }
  } catch (err) {
    logger.error("Error sending lesson scheduled email:", err.message);
  }
  sendSuccess(res, lesson, "Lesson created");
});

exports.updateLesson = catchAsync(async (req, res) => {

  const existing = await service.getById(req.params.lessonId);
  if (req.body.start_time) {

    const cls = await classService.getClassById(existing.class_id);
    const start = new Date(req.body.start_time);
    if (
      (cls.start_date && start < new Date(cls.start_date)) ||
      (cls.end_date && start > new Date(cls.end_date))
    ) {
      throw new AppError("Lesson start_time must be within class date range", 400);
    }
  }
  const update = { ...req.body };
  const updatedDuration = normalizeDuration(
    req.body.duration ?? req.body.duration_minutes,
  );
  if (updatedDuration !== undefined) {
    update.duration = updatedDuration;
  }
  delete update.duration_minutes;
  if (req.file) {
    if (existing?.topic_file_url) {
      const oldPath = path.join(__dirname, '../../../', existing.topic_file_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    update.topic_file_url = `/uploads/lessons/${req.file.filename}`;
  }
  const lesson = await service.updateLesson(req.params.lessonId, update);
  sendSuccess(res, lesson, "Lesson updated");
});

exports.deleteLesson = catchAsync(async (req, res) => {
  await service.deleteLesson(req.params.lessonId);
  sendSuccess(res, null, "Lesson deleted");
});
