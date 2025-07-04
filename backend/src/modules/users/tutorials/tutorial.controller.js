// 📁 src/modules/users/tutorials/tutorial.controller.js
const path = require("path");
const fs = require("fs");
const db = require("../../../config/database"); // ✅ Required for slug check
const service = require("./tutorial.service");
const chapterService = require("./chapters/tutorialChapter.service");
const tagService = require("./tutorialTag.service");

const catchAsync = require("../../../utils/catchAsync");
const { v4: uuidv4 } = require("uuid");


const { sendSuccess } = require("../../../utils/response");
const slugify = require("slugify");

// Helper to resolve uploads subdirectory based on user role
const getRoleDir = (req) => {
  let role = req.user?.role?.toLowerCase() || "other";
  if (["superadmin", "admin"].includes(role)) role = "admin";
  return role;
};

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
    title,
    description,
    category_id,
    level,
    duration,
    price,
    status = "draft",
    tags: rawTags,
    chapters = [],
  } = req.body;

  // In case chapters came as a serialized JSON string, parse it
  let parsedChapters = chapters;
  if (typeof parsedChapters === "string") {
    try {
      parsedChapters = JSON.parse(parsedChapters);
    } catch (err) {
      parsedChapters = [];
    }
  }

  // Filter out any chapter objects missing a title
  parsedChapters = Array.isArray(parsedChapters)
    ? parsedChapters.filter((ch) => ch && ch.title)
    : [];

  // 🚫 Prevent duplicate titles
  const existing = await db("tutorials").where({ title }).first();
  if (existing) {
    return res.status(400).json({ message: "Tutorial title already exists" });
  }

  const instructor_id = req.user.id;
  const slug = await generateUniqueSlug(title);
  const id = uuidv4();

  const roleDir = getRoleDir(req);
  const thumbnailFile = req.files?.thumbnail?.[0];
  const previewFile = req.files?.preview?.[0];

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
    moderation_status: status === "published" ? "Pending" : null,
    thumbnail_url: thumbnailFile
      ? `/uploads/tutorials/${roleDir}/${thumbnailFile.filename}`
      : null,
    preview_video: previewFile
      ? `/uploads/tutorials/${roleDir}/${previewFile.filename}`
      : null,
  };
  await service.createTutorial(tutorial);

  const tags = rawTags
    ? typeof rawTags === "string"
      ? JSON.parse(rawTags)
      : rawTags
    : [];
  if (tags.length) {
    const tagIds = [];
    for (const name of tags) {
      const existing = await tagService.findByName(name);
      const tag =
        existing ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addTutorialTags(id, tagIds);
    tutorial.tags = await service.getTutorialTags(id);
  }

  // Save chapters (if any)
  for (let i = 0; i < parsedChapters.length; i++) {
    const ch = parsedChapters[i];
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

exports.getMyTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getTutorialsByInstructor(req.user.id);
  sendSuccess(res, tutorials);
});


exports.getTutorialById = catchAsync(async (req, res) => {
  const tutorial = await service.getTutorialById(req.params.id);

  sendSuccess(res, tutorial);
});


exports.updateTutorial = catchAsync(async (req, res) => {
  const { tags: rawTags, ...data } = req.body;
  if (data.duration) {
    data.duration = parseInt(data.duration);
  }
  const roleDir = getRoleDir(req);
  if (req.files?.thumbnail) {
    data.thumbnail_url = `/uploads/tutorials/${roleDir}/${req.files.thumbnail[0].filename}`;
  }
  if (req.files?.preview) {
    data.preview_video = `/uploads/tutorials/${roleDir}/${req.files.preview[0].filename}`;
  }
  const tutorial = await service.updateTutorial(req.params.id, data);

  const tags = rawTags ? (typeof rawTags === 'string' ? JSON.parse(rawTags) : rawTags) : null;
  if (tags) {
    await db('tutorial_tag_map').where({ tutorial_id: tutorial.id }).del();
    const tagIds = [];
    for (const name of tags) {
      const existing = await tagService.findByName(name);
      const tag =
        existing ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addTutorialTags(tutorial.id, tagIds);
    tutorial.tags = await service.getTutorialTags(tutorial.id);
  }

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
  await service.updateModeration(req.params.id, "Approved");

  sendSuccess(res, { message: "Tutorial approved" });
});


exports.rejectTutorial = catchAsync(async (req, res) => {
  await service.updateModeration(req.params.id, "Rejected", req.body.reason);

  sendSuccess(res, { message: "Tutorial rejected" });
});


exports.bulkApproveTutorials = catchAsync(async (req, res) => {
  await service.bulkUpdateModeration(req.body.ids, "Approved");

  sendSuccess(res, { message: "Bulk approval done" });
});


exports.bulkDeleteTutorials = catchAsync(async (req, res) => {
  await service.bulkDeleteTutorials(req.body.ids);

  sendSuccess(res, { message: "Selected tutorials deleted" });
});

exports.getArchivedTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getArchivedTutorials();

  sendSuccess(res, tutorials);
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


exports.getTutorialAnalytics = catchAsync(async (req, res) => {
  const data = await service.getTutorialAnalytics(req.params.id);
  sendSuccess(res, data);
});
