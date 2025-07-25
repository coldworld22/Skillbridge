const service = require("./certificates.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");

/**
 * List all certificates
 */
exports.list = catchAsync(async (_req, res) => {
  const certificates = await service.getAll();
  sendSuccess(res, certificates);
});
