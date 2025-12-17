const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./policies.service");

exports.getPolicies = catchAsync(async (_req, res) => {
  const policies = await service.getPolicies();
  sendSuccess(res, policies || {});
});

exports.updatePolicies = catchAsync(async (req, res) => {
  const policies = await service.updatePolicies(req.body);
  sendSuccess(res, policies, "Policies updated");
});
