const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const service = require("./contributors.service");

exports.listContributors = catchAsync(async (req, res) => {
  let { limit } = req.query;
  if (limit === undefined) {
    limit = 20;
  } else {
    limit = Number(limit);
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new AppError("Invalid limit", 400);
    }
    limit = Math.min(limit, 100);
  }

  const contributors = await service.getTopContributors(limit);
  sendSuccess(res, contributors);
});
