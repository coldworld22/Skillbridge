const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const service = require("./public.service");
const planService = require("../../plans/plans.service");
const { parsePlanFeatures } = require("../../../utils/planFeatures");

exports.listDiscussions = catchAsync(async (_req, res) => {
  const list = await service.listDiscussions();
  sendSuccess(res, list);
});

exports.getDiscussion = catchAsync(async (req, res) => {
  const disc = await service.getDiscussion(
    req.params.id,
    req.user?.id,
    req.ip,
    req.headers['user-agent']
  );
  if (!disc) throw new AppError("Discussion not found", 404);
  sendSuccess(res, disc);
});

exports.createDiscussion = catchAsync(async (req, res) => {
  const { title, content } = req.body || {};
  let { tags } = req.body || {};
  if (!title || !content) throw new AppError("Missing fields", 400);

  const planId =
    req.user.plan_id || req.user.plan?.id || req.user.subscription?.plan_id;
  const plan = planId ? await planService.getPlanById(planId) : null;
  const features = parsePlanFeatures(plan);
  if (!features["community_post"]) {
    throw new AppError("Community posting not allowed for your plan", 403);
  }

  if (typeof tags === "string") {
    try { tags = JSON.parse(tags); } catch { tags = tags.split(',').map((t) => t.trim()).filter(Boolean); }
  }
  if (!Array.isArray(tags) || !tags.length) {
    throw new AppError("Tags are required", 400);
  }

  const disc = await service.createDiscussion({
    user_id: req.user.id,
    user_name: req.user.full_name,
    title,
    content,
    tags,
    image_url: Array.isArray(req.files) && req.files.length
      ? `/uploads/community/${req.files[0].filename}`
      : null,
  });
  sendSuccess(res, disc, "Discussion created");
});

exports.listContributors = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  const contributors = await service.getTopContributors(limit);
  sendSuccess(res, contributors);
});

exports.listTags = catchAsync(async (req, res) => {
  const q = req.query.q || '';
  const tags = await service.searchTags(q);
  sendSuccess(res, tags);
});

exports.relatedQuestions = catchAsync(async (req, res) => {
  const q = req.query.query || req.query.q || '';
  const questions = await service.searchRelatedQuestions(q);
  sendSuccess(res, { questions });
});

exports.listReplies = catchAsync(async (req, res) => {
  const replies = await service.listReplies(req.params.id);
  sendSuccess(res, replies);
});

exports.createReply = catchAsync(async (req, res) => {
  const { content } = req.body || {};
  if (!content) throw new AppError('Missing fields', 400);

  const planId =
    req.user.plan_id || req.user.plan?.id || req.user.subscription?.plan_id;
  const plan = planId ? await planService.getPlanById(planId) : null;
  const features = parsePlanFeatures(plan);
  if (!features["community_post"]) {
    throw new AppError("Community posting not allowed for your plan", 403);
  }

  const file = req.files?.file?.[0];
  const audio = req.files?.audio?.[0];

  const reply = await service.createReply({
    discussion_id: req.params.id,
    user_id: req.user.id,
    content,
    file_url: file
      ? `/uploads/community/${file.filename}`
      : audio
      ? `/uploads/community/${audio.filename}`
      : null,
  });
  sendSuccess(res, reply, 'Reply posted');
});

exports.likeDiscussion = catchAsync(async (req, res) => {
  await service.likeDiscussion(req.user.id, req.params.id);
  const likes = await service.getLikeCount(req.params.id);
  sendSuccess(res, { likes }, 'Liked');
});

exports.unlikeDiscussion = catchAsync(async (req, res) => {
  await service.unlikeDiscussion(req.user.id, req.params.id);
  const likes = await service.getLikeCount(req.params.id);
  sendSuccess(res, { likes }, 'Unliked');
});

exports.voteDiscussion = catchAsync(async (req, res) => {
  const { type } = req.body || {};
  if (!['up', 'down'].includes(type)) throw new AppError('Invalid vote', 400);
  const votes = await service.voteDiscussion(
    req.user.id,
    req.params.id,
    type === 'up' ? 1 : -1
  );
  sendSuccess(res, { votes }, 'Voted');
});
