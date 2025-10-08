/**
 * Certificate admin controller
 */
const service = require("./certificates.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");

/**
 * List all certificates
 */
exports.list = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const certificates = await service.getAll({ page, limit });
  sendSuccess(res, certificates);
});
