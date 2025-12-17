const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./popupAnnouncements.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

exports.list = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.active = catchAsync(async (req, res) => {
  const { audience, page } = req.query;
  const data = await service.getActive({ audience, page });
  sendSuccess(res, data);
});

exports.create = catchAsync(async (req, res) => {
  const {
    title,
    message,
    audience = "all",
    pages = [],
    start_date,
    end_date,
    position = "center",
    theme = "yellow",
    once_per_session = true,
    active = true,
  } = req.body || {};
  if (!title || !message) throw new AppError("Title and message required", 400);
  if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
    throw new AppError("end_date must be after start_date", 400);
  }
  const payload = {
    title,
    message,
    audience,

    pages,
    start_date,
    end_date,
    position,
    theme,
    once_per_session,
    active,
    author_id: req.user.id,
    created_at: new Date(),
  };
  const ann = await service.create(payload);
  sendSuccess(res, ann, "Announcement created");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  Promise.allSettled(
    admins.flatMap((admin) => [
      notificationService.createNotification({
        user_id: admin.id,
        type: "popup_announcement_created",
        message: `New popup announcement: ${title}`,
      }),
      messageService.createMessage({
        sender_id: senderId || admin.id,
        receiver_id: admin.id,
        message: `New popup announcement: ${title}`,
      }),
    ])
  ).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") {
        logger.error(
          "Failed to dispatch popup announcement notification:",
          r.reason?.message || r.reason
        );
      }
    });
  });
});

exports.update = catchAsync(async (req, res) => {
  const { start_date, end_date } = req.body || {};
  if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
    throw new AppError("end_date must be after start_date", 400);
  }
  const ann = await service.update(req.params.id, req.body);
  if (!ann) throw new AppError("Announcement not found", 404);
  sendSuccess(res, ann, "Announcement updated");
});

exports.remove = catchAsync(async (req, res) => {
  await service.remove(req.params.id);
  sendSuccess(res, null, "Announcement deleted");
});
