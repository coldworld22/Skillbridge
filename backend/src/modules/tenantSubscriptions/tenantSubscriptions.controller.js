const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const subscriptionSync = require("../../services/subscriptionSyncService");

exports.replaySubscriptions = catchAsync(async (req, res) => {
  const tenantId = req.body?.tenant_id || req.query?.tenant_id || null;
  const result = await subscriptionSync.replayTenantSubscriptions({ tenantId });
  sendSuccess(res, result, "Subscription replay completed");
});
