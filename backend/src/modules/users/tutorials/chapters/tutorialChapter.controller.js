const catchAsync = require("../../../../utils/catchAsync");
const AppError = require("../../../../utils/AppError");
const service = require("./tutorialChapter.service");
const { sendSuccess } = require("../../../../utils/response");
const { v4: uuidv4 } = require("uuid");
const uploadChapterVideo = require("./uploadChapterVideo");

// Handle chapter video uploads
exports.uploadVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video uploaded" });
  }
  const videoUrl = `/uploads/tutorials/chapters/${req.file.filename}`;
  return res.status(200).json({ video_url: videoUrl });
};


// Create chapter
exports.createChapter = catchAsync(async (req, res) => {
  const { tutorial_id, title, order, video_url, duration, is_preview = false } = req.body;
  if (!title || !tutorial_id) throw new AppError("Tutorial ID and title are required", 400);

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

  const updated = await service.update(id, req.body);
  sendSuccess(res, updated, "Chapter updated");
});

// Delete chapter
exports.deleteChapter = catchAsync(async (req, res) => {
  const { id } = req.params;
  const chapter = await service.findById(id);
  if (!chapter) throw new AppError("Chapter not found", 404);

  await service.delete(id);
  sendSuccess(res, null, "Chapter deleted");
});

// List chapters by tutorial
exports.getChaptersByTutorial = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const isGuest = !req.user;

  let chapters = await service.getByTutorial(tutorialId);

  // Filter only previews if guest
  if (isGuest) {
    chapters = chapters.filter((ch) => ch.is_preview);
  }

  sendSuccess(res, chapters, "Chapters fetched");
});

// Reorder chapters within a tutorial
exports.reorderChapters = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    throw new AppError("orderedIds must be an array", 400);
  }

  const updates = orderedIds.map((id, index) => ({ id, order: index + 1 }));
  await service.reorderChapters(tutorialId, updates);

  sendSuccess(res, null, "Chapters reordered");
});

