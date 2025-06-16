const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payments.service");
const { v4: uuidv4 } = require("uuid");

exports.createPayment = catchAsync(async (req, res) => {
  const { user_id, method_id, item_type, item_id, amount, currency, status, reference_id } = req.body;
  if (!user_id || !method_id || !item_type || !item_id || !amount) {
    throw new AppError("Missing required fields", 400);
  }

  const payment = await service.create({
    id: uuidv4(),
    user_id,
    method_id,
    item_type,
    item_id,
    amount,
    currency: currency || "USD",
    status: status || "pending",
    reference_id,
    paid_at: status === "paid" ? new Date() : null,
  });

  sendSuccess(res, payment, "Payment created");
});

exports.getPayments = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.getPayment = catchAsync(async (req, res) => {
  const payment = await service.getById(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);
  sendSuccess(res, payment);
});

exports.updatePayment = catchAsync(async (req, res) => {
  const payment = await service.update(req.params.id, req.body);
  if (!payment) throw new AppError("Payment not found", 404);
  sendSuccess(res, payment, "Payment updated");
});

exports.deletePayment = catchAsync(async (req, res) => {
  await service.delete(req.params.id);
  sendSuccess(res, null, "Payment deleted");
});
