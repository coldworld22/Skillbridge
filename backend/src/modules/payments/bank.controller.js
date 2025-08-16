const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const db = require("../../config/database");

// Basic recursive sanitization for user input
const sanitize = (value) => {
  if (typeof value === "string") {
    return value.replace(/[^\w\s@.-]/g, "").trim();
  }
  return value;
};

const sanitizeObject = (obj = {}) => {
  const cleaned = {};
  for (const key in obj) {
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      cleaned[key] = sanitizeObject(val);
    } else if (Array.isArray(val)) {
      cleaned[key] = val.map((v) => sanitize(v));
    } else {
      cleaned[key] = sanitize(val);
    }
  }
  return cleaned;
};

exports.initiateBankPayment = catchAsync(async (req, res) => {
  const body = sanitizeObject(req.body);
  const orderId = body.orderId || body.order_id;
  if (!orderId) throw new AppError("Order ID is required", 400);

  const order = await db("orders").where({ id: orderId }).first();
  if (!order) throw new AppError("Order not found", 404);
  if (order.user_id !== req.user.id) {
    throw new AppError("You do not own this order", 403);
  }

  const method = await db("payment_methods_config")
    .where({ type: "bank", active: true })
    .first();
  if (!method) throw new AppError("Bank payments are not enabled", 400);

  const paymentData = {
    id: uuidv4(),
    user_id: req.user.id,
    method_id: method.id,
    item_type: "order",
    item_id: order.id,
    amount: order.total_amount || order.amount || 0,
    currency: order.currency || "USD",
    status: "pending",
    reference_id: order.id,
  };

  const [payment] = await db("payments").insert(paymentData).returning("*");
  sendSuccess(res, payment, "Bank payment initiated");
});

exports.confirmBankPayment = catchAsync(async (req, res) => {
  const body = sanitizeObject(req.body);
  const paymentId = body.paymentId || body.payment_id;
  const orderId = body.orderId || body.order_id;
  if (!paymentId || !orderId) {
    throw new AppError("Payment ID and Order ID are required", 400);
  }

  const payment = await db("payments").where({ id: paymentId }).first();
  if (!payment) throw new AppError("Payment not found", 404);

  const order = await db("orders").where({ id: orderId }).first();
  if (!order) throw new AppError("Order not found", 404);

  if (payment.user_id !== order.user_id) {
    throw new AppError("Payment does not belong to this user", 403);
  }
  const paymentOrderId = payment.item_id || payment.reference_id;
  if (paymentOrderId !== order.id) {
    throw new AppError("Payment is not associated with the provided order", 400);
  }

  const [updated] = await db("payments")
    .where({ id: paymentId })
    .update({ status: "paid", paid_at: new Date() })
    .returning("*");

  sendSuccess(res, updated, "Bank payment confirmed");
});

