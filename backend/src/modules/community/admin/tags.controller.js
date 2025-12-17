const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const service = require("./tags.service");

exports.listTags = catchAsync(async (_req, res) => {
  const tags = await service.getAllTags();
  sendSuccess(res, tags);
});

exports.createTag = catchAsync(async (req, res) => {
  const { name, slug, description, active } = req.body;
  if (!name || !slug) throw new AppError("Name and slug required", 400);
  const tag = await service.createTag({ name, slug, description, active: active !== false, created_at: new Date() });
  sendSuccess(res, tag, "Tag created");
});

exports.updateTag = catchAsync(async (req, res) => {
  const tag = await service.updateTag(req.params.id, req.body);
  if (!tag) throw new AppError("Tag not found", 404);
  sendSuccess(res, tag, "Tag updated");
});

exports.deleteTag = catchAsync(async (req, res) => {
  await service.deleteTag(req.params.id);
  sendSuccess(res, null, "Tag deleted");
});
