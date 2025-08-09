const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payments.service");
const { v4: uuidv4 } = require("uuid");
const smsService = require("../../services/smsService");
const userModel = require("../users/user.model");
const libraryService = require("../library/library.service");
const enrollmentService = require("../classes/enrollments/classEnrollment.service");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");

exports.createPayment = catchAsync(async (req, res) => {
  const {
    user_id,
    method_id,
    item_type,
    item_id,
    amount,
    currency,
    status,
    reference_id,
    allow_installments,
    installments,
    receipt_url,
  } = req.body;
  if (!user_id || !method_id || !item_type || !item_id || !amount) {
    throw new AppError("Missing required fields", 400);
  }

  let schedules = [];
  let next_due_date = null;
  let totalInstallments = allow_installments ? installments || 1 : 1;
  if (allow_installments && totalInstallments > 1) {
    for (let i = 2; i <= totalInstallments; i++) {
      const due = new Date();
      due.setMonth(due.getMonth() + (i - 1));
      schedules.push({
        installment_number: i,
        amount,
        due_date: due,
      });
    }
    next_due_date = schedules[0]?.due_date || null;
  }

  let platform_fee = 0;
  let instructor_amount = amount;
  try {
    const settings = await paymentConfigService.getSettings();
    const cut = settings?.platformCut?.[item_type] || 0;
    platform_fee = (amount * cut) / 100;
    instructor_amount = amount - platform_fee;
  } catch (err) {
    console.error("Failed to load payment settings:", err);
  }

  const createData = {
    id: uuidv4(),
    user_id,
    method_id,
    item_type,
    item_id,
    amount,
    currency: currency || "USD",
    status: status || "pending",
    reference_id,
    receipt_url,
    platform_fee,
    instructor_amount,
    paid_at: status === "paid" ? new Date() : null,
    installments: totalInstallments,
    installment_number: 1,
    next_due_date,
  };
  const createArgs = [createData];
  if (schedules.length) createArgs.push(schedules);
  const payment = await service.create(...createArgs);

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

  if (item_type === "class" && payment.status === "paid") {
    try {
      await enrollmentService.createEnrollment({
        id: uuidv4(),
        user_id,
        class_id: item_id,
        status: "enrolled",
      });
    } catch (err) {
      console.error("Failed to enroll after payment:", err);
    }
  }

  sendSuccess(res, payment, "Payment created");
});

exports.uploadReceipt = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const url = `/uploads/payment-receipts/${req.file.filename}`;
  sendSuccess(res, { url }, "Receipt uploaded");
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
