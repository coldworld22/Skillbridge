const catchAsync = require('../../../utils/catchAsync');
const { sendSuccess } = require('../../../utils/response');
const service = require('./classNotification.service');
const startClassReminderJob = require('../../../jobs/classReminderJob');

let jobStarted = false;

exports.subscribe = catchAsync(async (req, res) => {
  await service.subscribe(req.user.id, req.params.classId);
  if (!jobStarted) {
    startClassReminderJob();
    jobStarted = true;
  }
  sendSuccess(res, null, 'Class reminder subscribed');
});
