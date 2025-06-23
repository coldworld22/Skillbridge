const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./class.service");
const slugify = require("slugify");
const db = require("../../config/database");

const fs = require("fs");
const path = require("path");

const generateUniqueSlug = async (title) => {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let count = 1;
  while (await db("online_classes").where({ slug }).first()) {
    slug = `${base}-${count++}`;
  }
  return slug;
};

exports.createClass = catchAsync(async (req, res) => {
  const slug = await generateUniqueSlug(req.body.title);
  const data = { ...req.body, id: uuidv4(), slug, moderation_status: "Pending" };
  if (req.files?.cover_image?.[0]) {
    data.cover_image = `/uploads/classes/${req.files.cover_image[0].filename}`;
  }
  if (req.files?.demo_video?.[0]) {
    data.demo_video_url = `/uploads/classes/${req.files.demo_video[0].filename}`;
  }
  const cls = await service.createClass(data);
  sendSuccess(res, cls, "Class created");
});

exports.getAllClasses = catchAsync(async (_req, res) => {
  const classes = await service.getAllClasses();
  sendSuccess(res, classes);
});

exports.getClassById = catchAsync(async (req, res) => {
  const cls = await service.getClassById(req.params.id);
  sendSuccess(res, cls);
});

exports.updateClass = catchAsync(async (req, res) => {
  const existing = await service.getClassById(req.params.id);
  let data = { ...req.body };
  if (data.title && data.title !== existing.title) {
    data.slug = await generateUniqueSlug(data.title);
  }
  if (req.files?.cover_image?.[0]) {
    if (existing?.cover_image) {
      const oldPath = path.join(__dirname, '../../../', existing.cover_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.cover_image = `/uploads/classes/${req.files.cover_image[0].filename}`;
  }
  if (req.files?.demo_video?.[0]) {
    if (existing?.demo_video_url) {
      const oldPath = path.join(__dirname, '../../../', existing.demo_video_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.demo_video_url = `/uploads/classes/${req.files.demo_video[0].filename}`;
  }
  const cls = await service.updateClass(req.params.id, data);
  sendSuccess(res, cls);
});

exports.deleteClass = catchAsync(async (req, res) => {
  await service.deleteClass(req.params.id);
  sendSuccess(res, null, "Class deleted");
});

exports.getPublishedClasses = catchAsync(async (_req, res) => {
  const classes = await service.getPublishedClasses();
  sendSuccess(res, classes);
});

exports.getPublicClassDetails = catchAsync(async (req, res) => {
  const cls = await service.getPublicClassDetails(req.params.id);
  sendSuccess(res, cls);
});

exports.getClassAnalytics = catchAsync(async (req, res) => {
  const data = await service.getClassAnalytics(req.params.id);
  sendSuccess(res, data);
});

exports.toggleClassStatus = catchAsync(async (req, res) => {
  const cls = await service.togglePublishStatus(req.params.id);
  sendSuccess(res, cls);
});

exports.approveClass = catchAsync(async (req, res) => {
  await service.updateModeration(req.params.id, "Approved");
  sendSuccess(res, { message: "Class approved" });
});

exports.rejectClass = catchAsync(async (req, res) => {
  await service.updateModeration(req.params.id, "Rejected", req.body.reason);
  sendSuccess(res, { message: "Class rejected" });
});
