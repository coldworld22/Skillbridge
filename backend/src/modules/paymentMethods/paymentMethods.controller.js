const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./paymentMethods.service");
const path = require("path");
const fs = require("fs");

exports.createMethod = catchAsync(async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) throw new AppError("Name and type are required", 400);
  const data = { ...req.body };
  if (req.file) {
    data.icon = `/uploads/payment-methods/${req.file.filename}`;
  }
  const method = await service.create(data);
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
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError("Payment method not found", 404);

  const data = { ...req.body };
  if (req.file) {
    if (existing.icon) {
      const old = path.join(__dirname, '../../../', existing.icon);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    data.icon = `/uploads/payment-methods/${req.file.filename}`;
  }

  const method = await service.update(req.params.id, data);
  sendSuccess(res, method, "Method updated");
});

exports.deleteMethod = catchAsync(async (req, res) => {
  await service.delete(req.params.id);
  sendSuccess(res, null, "Method deleted");
});
