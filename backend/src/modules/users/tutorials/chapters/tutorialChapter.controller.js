const catchAsync = require("../../../../utils/catchAsync");
const AppError = require("../../../../utils/AppError");
const service = require("./tutorialChapter.service");
const { sendSuccess } = require("../../../../utils/response");
const { v4: uuidv4 } = require("uuid");
const uploadChapterVideo = require("./uploadChapterVideo");
const db = require("../../../../config/database");
const { requireUser, requireValidTutorialId } = require("../utils");

// Ensure the requesting user is the tutorial's instructor or an admin
const assertTutorialAccess = async (req, tutorialId) => {
  requireUser(req);
  requireValidTutorialId({ params: { tutorialId } });
  const tutorial = await db("tutorials")
    .select("instructor_id")
    .where({ id: tutorialId })
    .first();

  if (!tutorial) throw new AppError("Tutorial not found", 404);

  const role = req.user?.role?.toLowerCase();
  const isAdmin = ["admin", "superadmin"].includes(role);
  if (tutorial.instructor_id !== req.user.id && !isAdmin) {
    throw new AppError("Access denied", 403);
  }
};

// Handle chapter video uploads
exports.uploadVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video uploaded" });
  }
  let role = req.user?.role?.toLowerCase() || "other";
  if (["superadmin", "admin"].includes(role)) role = "admin";
  const videoUrl = `/uploads/tutorials/chapters/${role}/${req.file.filename}`;
  return res.status(200).json({ video_url: videoUrl });
};


// Create chapter
exports.createChapter = catchAsync(async (req, res) => {
  const { tutorial_id, title, order, video_url, duration, is_preview = false } = req.body;
  if (!title || !tutorial_id) throw new AppError("Tutorial ID and title are required", 400);

  await assertTutorialAccess(req, tutorial_id);

  const chapter = await service.create({
    id: uuidv4(),
    tutorial_id,
    title,
    order: parseInt(order) || 1,
    video_url,
    duration: parseInt(duration) || 0,
    is_preview: Boolean(is_preview)
  });

  sendSuccess(res, chapter, "Chapter created");
});

// Update chapter
exports.updateChapter = catchAsync(async (req, res) => {
  const { id } = req.params;
  const chapter = await service.findById(id);
  if (!chapter) throw new AppError("Chapter not found", 404);

  await assertTutorialAccess(req, chapter.tutorial_id);

  const data = { ...req.body };
  if (data.duration) {
    data.duration = parseInt(data.duration);
  }
  const updated = await service.update(id, data);
  sendSuccess(res, updated, "Chapter updated");
});

// Delete chapter
exports.deleteChapter = catchAsync(async (req, res) => {
  const { id } = req.params;
  const chapter = await service.findById(id);
  if (!chapter) throw new AppError("Chapter not found", 404);

  await assertTutorialAccess(req, chapter.tutorial_id);

  await service.delete(id);
  sendSuccess(res, null, "Chapter deleted");
});

// List chapters by tutorial
exports.getChaptersByTutorial = catchAsync(async (req, res) => {
  const tutorialId = requireValidTutorialId(req);

  const tutorial = await db("tutorials")
    .select("id", "status", "moderation_status", "instructor_id")
    .where({ id: tutorialId })
    .first();

  if (!tutorial) throw new AppError("Tutorial not found", 404);

  const role = req.user?.role?.toLowerCase();
  const userId = req.user?.id;
  const isAdmin = role && ["admin", "superadmin"].includes(role);
  const isOwnerInstructor =
    role === "instructor" && tutorial.instructor_id === userId;
  const isPrivileged = Boolean(req.user && (isAdmin || isOwnerInstructor));

  if (!isPrivileged && tutorial.status !== "published") {
    throw new AppError("Tutorial not published", 404);
  }

  let chapters = await service.getByTutorial(tutorialId);

  if (!isPrivileged) {
    let enrollment = null;
    if (req.user) {
      enrollment = await db("tutorial_enrollments")
        .where({ tutorial_id: tutorialId, user_id: req.user.id })
        .first();
    }

    if (!enrollment) {
      const firstChapterId = chapters[0]?.id;
      chapters = chapters.filter(
        (ch) => ch.is_preview || ch.id === firstChapterId
      );
    }
  }

  sendSuccess(res, chapters, "Chapters fetched");
});

// Reorder chapters within a tutorial
exports.reorderChapters = catchAsync(async (req, res) => {
  const tutorialId = requireValidTutorialId(req);
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    throw new AppError("orderedIds must be an array", 400);
  }

  await assertTutorialAccess(req, tutorialId);

  const updates = orderedIds.map((id, index) => ({ id, order: index + 1 }));
  await service.reorderChapters(tutorialId, updates);

  sendSuccess(res, null, "Chapters reordered");
});
