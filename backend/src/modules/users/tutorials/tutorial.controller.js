// 📁 src/modules/users/tutorials/tutorial.controller.js
const path = require("path");
const fs = require("fs");
const db = require("../../../config/database"); // ✅ Required for slug check
const service = require("./tutorial.service");
const chapterService = require("./chapters/tutorialChapter.service");

const catchAsync = require("../../../utils/catchAsync");
const { v4: uuidv4 } = require("uuid");


const { sendSuccess } = require("../../../utils/response");
const slugify = require("slugify");

// ✅ Helper: Generate a unique slug based on title
const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  while (await db("tutorials").where({ slug }).first()) {
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};

exports.createTutorial = catchAsync(async (req, res) => {
  const {
    title, description, category_id, level, duration,
    price, status = "draft", chapters = []
  } = req.body;

  const instructor_id = req.user.id;
  const slug = slugify(title, { lower: true, strict: true });
  const id = uuidv4();

  // Save tutorial
  const tutorial = {
    id,
    title,
    slug,
    description,
    category_id,
    level,
    duration: duration ? parseInt(duration) : null,
    price,
    instructor_id,
    status,
    thumbnail_url: req.file ? `/uploads/tutorials/${req.file.filename}` : null,
  };
  await service.createTutorial(tutorial);

  // Save chapters (if any)
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    await chapterService.create({
      id: uuidv4(),
      tutorial_id: id,
      title: ch.title,
      video_url: ch.video_url,
      duration: ch.duration,
      order: ch.order ?? i + 1,
      is_preview: ch.is_preview ?? false,
    });
  }

  sendSuccess(res, tutorial, "Tutorial with chapters created");
});


exports.getAllTutorials = async (req, res) => {
  const tutorials = await service.getAllTutorials(req.query);
  sendSuccess(res, tutorials);
};


exports.getTutorialById = catchAsync(async (req, res) => {
  const tutorial = await service.getTutorialById(req.params.id);

  sendSuccess(res, tutorial);
});


exports.updateTutorial = catchAsync(async (req, res) => {
  const data = req.body;
  if (data.duration) {
    data.duration = parseInt(data.duration);
  }
  if (req.files?.thumbnail) {
    data.cover_image = `/uploads/tutorials/${req.files.thumbnail[0].filename}`;
  }
  if (req.files?.preview) {
    data.preview_video = `/uploads/tutorials/${req.files.preview[0].filename}`;
  }
  const tutorial = await service.updateTutorial(req.params.id, data);

  sendSuccess(res, tutorial);
});


exports.softDeleteTutorial = catchAsync(async (req, res) => {
  await service.updateStatus(req.params.id, { status: "archived" });

  sendSuccess(res, { message: "Archived" });
});


exports.restoreTutorial = catchAsync(async (req, res) => {
  await service.updateStatus(req.params.id, { status: "draft" });

  sendSuccess(res, { message: "Restored to draft" });
});


exports.permanentlyDeleteTutorial = catchAsync(async (req, res) => {
  await service.permanentlyDeleteTutorial(req.params.id);

  sendSuccess(res, { message: "Permanently deleted" });
});


exports.togglePublishStatus = catchAsync(async (req, res) => {
  await service.togglePublishStatus(req.params.id);

  sendSuccess(res, { message: "Status toggled" });
});


exports.approveTutorial = catchAsync(async (req, res) => {
  await service.updateModeration(req.params.id, "approved");

  sendSuccess(res, { message: "Tutorial approved" });
});


exports.rejectTutorial = catchAsync(async (req, res) => {
  await service.updateModeration(req.params.id, "rejected", req.body.reason);

  sendSuccess(res, { message: "Tutorial rejected" });
});


exports.bulkApproveTutorials = catchAsync(async (req, res) => {
  await service.bulkUpdateModeration(req.body.ids, "approved");

  sendSuccess(res, { message: "Bulk approval done" });
});


exports.bulkTrashTutorials = catchAsync(async (req, res) => {
  await service.bulkUpdateStatus(req.body.ids, "archived");

  sendSuccess(res, { message: "Bulk archived" });
});


exports.getFeaturedTutorials = catchAsync(async (req, res) => {
  const featured = await service.getFeaturedTutorials();

  sendSuccess(res, featured);
});


exports.getPublishedTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getPublishedTutorials(req.query);

  sendSuccess(res, tutorials);
});


exports.getPublicTutorialDetails = catchAsync(async (req, res) => {
  const tutorial = await service.getPublicTutorialDetails(req.params.id);

  sendSuccess(res, tutorial);
});
exports.getTutorialsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const tutorials = await service.getTutorialsByCategory(categoryId);
  sendSuccess(res, tutorials);
};

