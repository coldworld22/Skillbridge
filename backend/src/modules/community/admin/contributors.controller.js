const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./contributors.service");

exports.listContributors = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const contributors = await service.getTopContributors(limit);
  sendSuccess(res, contributors);
});
