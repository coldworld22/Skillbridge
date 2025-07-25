const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');
const service = require('./errorLogs.service');

/**
 * Controller for listing recent system errors.
 * Responds with an array of log entries as returned by the service.
 */

exports.list = catchAsync(async (_req, res) => {
  const logs = await service.getRecentErrors();
  sendSuccess(res, logs);
});
