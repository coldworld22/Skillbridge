const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const service = require("./announcements.service");

exports.listAnnouncements = catchAsync(async (_req, res) => {
  const data = await service.getAllAnnouncements();
  sendSuccess(res, data);
});

exports.createAnnouncement = catchAsync(async (req, res) => {
  const { title, message, audience = "all", pinned = false, start_date, end_date } = req.body;
  if (!title || !message) throw new AppError("Title and message required", 400);
  const ann = await service.createAnnouncement({
    title,
    message,
    audience,
    pinned,
    start_date,
    end_date,
    author_id: req.user.id,
    created_at: new Date(),
  });
  sendSuccess(res, ann, "Announcement created");
});

exports.updateAnnouncement = catchAsync(async (req, res) => {
  const ann = await service.updateAnnouncement(req.params.id, req.body);
  if (!ann) throw new AppError("Announcement not found", 404);
  sendSuccess(res, ann, "Announcement updated");
});

exports.deleteAnnouncement = catchAsync(async (req, res) => {
  await service.deleteAnnouncement(req.params.id);
  sendSuccess(res, null, "Announcement deleted");
});
