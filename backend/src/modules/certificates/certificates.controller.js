/**
 * Certificate admin controller
 */
const service = require("./certificates.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");

/**
 * List all certificates
 */
exports.list = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const certificates = await service.getAll({ page, limit });
  sendSuccess(res, certificates);
});

exports.getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const certificate = await service.getById(id);

  if (!certificate) {
    throw new AppError("Certificate not found", 404);
  }

  sendSuccess(res, certificate);
});
