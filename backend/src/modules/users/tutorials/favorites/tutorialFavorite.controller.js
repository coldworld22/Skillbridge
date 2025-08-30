const catchAsync = require('../../../../utils/catchAsync');
const { sendSuccess } = require('../../../../utils/response');
const service = require('./tutorialFavorite.service');
const { requireUser, requireUserAndTutorial } = require('../utils');

exports.add = catchAsync(async (req, res) => {
  const { userId, tutorialId } = requireUserAndTutorial(req);
  await service.add(userId, tutorialId);
  sendSuccess(res, null, 'Added to favorites');
});

exports.remove = catchAsync(async (req, res) => {
  const { userId, tutorialId } = requireUserAndTutorial(req);
  await service.remove(userId, tutorialId);
  sendSuccess(res, null, 'Removed from favorites');
});

exports.listMine = catchAsync(async (req, res) => {
  const userId = requireUser(req);
  const list = await service.listByUser(userId);
  sendSuccess(res, list);
});
