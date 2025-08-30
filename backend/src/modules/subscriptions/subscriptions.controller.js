const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./subscription.service");

exports.getMySubscriptions = catchAsync(async (req, res) => {
  const subs = await service.getActiveByUser(req.user.id);
  sendSuccess(res, subs);
});

exports.createOrRenewSubscription = catchAsync(async (req, res) => {
  const { plan_id, interval = "monthly" } = req.body;
  const subscription = await service.createOrRenewSubscription({
    user_id: req.user.id,
    plan_id,
    interval,
  });
  sendSuccess(res, subscription);
});
