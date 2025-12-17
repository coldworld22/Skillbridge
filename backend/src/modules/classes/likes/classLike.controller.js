const catchAsync = require('../../../utils/catchAsync');
const { sendSuccess } = require('../../../utils/response');
const service = require('./classLike.service');

exports.add = catchAsync(async (req, res) => {
  await service.add(req.user.id, req.params.classId);
  sendSuccess(res, null, 'Class liked');
});

exports.remove = catchAsync(async (req, res) => {
  await service.remove(req.user.id, req.params.classId);
  sendSuccess(res, null, 'Like removed');
});

exports.listMine = catchAsync(async (req, res) => {
  const list = await service.listByUser(req.user.id);
  sendSuccess(res, list);
});
