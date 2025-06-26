const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./paymentMethods.service");

exports.createMethod = catchAsync(async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) throw new AppError("Name and type are required", 400);
  const method = await service.create(req.body);
  sendSuccess(res, method, "Method created");
});

exports.getMethods = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.getActiveMethods = catchAsync(async (_req, res) => {
  const data = await service.getActive();
  sendSuccess(res, data);
});

exports.getMethod = catchAsync(async (req, res) => {
  const method = await service.getById(req.params.id);
  if (!method) throw new AppError("Payment method not found", 404);
  sendSuccess(res, method);
});

exports.updateMethod = catchAsync(async (req, res) => {
  const method = await service.update(req.params.id, req.body);
  if (!method) throw new AppError("Payment method not found", 404);
  sendSuccess(res, method, "Method updated");
});

exports.deleteMethod = catchAsync(async (req, res) => {
  await service.delete(req.params.id);
  sendSuccess(res, null, "Method deleted");
});
