const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const service = require("./reports.service");

exports.listReports = catchAsync(async (_req, res) => {
  const data = await service.getAllReports();
  sendSuccess(res, data);
});

exports.updateReport = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new AppError("Status required", 400);
  const report = await service.updateStatus(req.params.id, status);
  if (!report) throw new AppError("Report not found", 404);
  sendSuccess(res, report, "Report updated");
});
