const catchAsync = require('../../../../utils/catchAsync');
const { sendSuccess } = require('../../../../utils/response');
const service = require('./tutorialFavorite.service');

exports.add = catchAsync(async (req, res) => {
  await service.add(req.user.id, req.params.tutorialId);
  sendSuccess(res, null, 'Added to favorites');
});

exports.remove = catchAsync(async (req, res) => {
  await service.remove(req.user.id, req.params.tutorialId);
  sendSuccess(res, null, 'Removed from favorites');
});

exports.listMine = catchAsync(async (req, res) => {
  const list = await service.listByUser(req.user.id);
  sendSuccess(res, list);
});
