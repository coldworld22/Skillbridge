const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payments.service");
const { v4: uuidv4 } = require("uuid");
const smsService = require("../../services/smsService");
const userModel = require("../users/user.model");
const libraryService = require("../library/library.service");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");

exports.createPayment = catchAsync(async (req, res) => {
  const { user_id, method_id, item_type, item_id, amount, currency, status, reference_id } = req.body;
  if (!user_id || !method_id || !item_type || !item_id || !amount) {
    throw new AppError("Missing required fields", 400);
  }

  const settings = await paymentConfigService.getSettings();
  const rate = settings?.platformCut?.[item_type] || 0;
  const platform_fee = (amount * rate) / 100;
  const instructor_amount = amount - platform_fee;

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
    platform_fee,
    instructor_amount,
  });
  try {
    const user = await userModel.findById(user_id);
    if (user?.phone) {
      const text = `Payment of ${amount} received. Ref: ${payment.reference_id}`;
      await smsService.sendSMS({ to: user.phone, text });
    }
  } catch (err) {
    console.error("Failed to send payment SMS:", err);
  }

  if (item_type === "book" && payment.status === "paid") {
    try {
      await libraryService.recordPurchase(user_id, item_id, amount);
    } catch (err) {
      console.error("Failed to record book purchase:", err);
    }
  }

  sendSuccess(res, payment, "Payment created");
});

exports.getPayments = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.getMyPayments = catchAsync(async (req, res) => {
  const data = await service.getByUser(req.user.id);
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
