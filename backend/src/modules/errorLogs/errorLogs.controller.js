const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');
const service = require('./errorLogs.service');

exports.list = catchAsync(async (_req, res) => {
  const logs = await service.getRecentErrors();
  sendSuccess(res, logs);
});
