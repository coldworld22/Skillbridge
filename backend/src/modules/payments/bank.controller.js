const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const paymentsService = require("./payments.service");

exports.confirmBankPayment = catchAsync(async (req, res) => {
  const { paymentId, transactionReference } = req.body;
  if (!paymentId || !transactionReference) {
    throw new AppError("Missing required fields", 400);
  }
  if (!req.file) {
    throw new AppError("Receipt file is required", 400);
  }
  const receipt_url = `/uploads/payment-receipts/${req.file.filename}`;
  const payment = await paymentsService.update(paymentId, {
    status: "awaiting_approval",
    receipt_url,
    reference_id: transactionReference,
  });
  if (!payment) throw new AppError("Payment not found", 404);
  sendSuccess(res, payment, "Bank payment confirmation submitted");
});
