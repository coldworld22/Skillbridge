const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const service = require("./public.service");

exports.listDiscussions = catchAsync(async (_req, res) => {
  const list = await service.listDiscussions();
  sendSuccess(res, list);
});

exports.getDiscussion = catchAsync(async (req, res) => {
  const disc = await service.getDiscussion(req.params.id);
  if (!disc) throw new AppError("Discussion not found", 404);
  sendSuccess(res, disc);
});

exports.createDiscussion = catchAsync(async (req, res) => {
  const { title, content, tags } = req.body || {};
  if (!title || !content) throw new AppError("Missing fields", 400);
  const disc = await service.createDiscussion({
    user_id: req.user.id,
    user_name: req.user.full_name,
    title,
    content,
    tags,
  });
  sendSuccess(res, disc, "Discussion created");
});

exports.listContributors = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  const contributors = await service.getTopContributors(limit);
  sendSuccess(res, contributors);
});
