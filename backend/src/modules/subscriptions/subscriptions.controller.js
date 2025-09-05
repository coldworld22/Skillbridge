const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./subscription.service");
const paymentsService = require("../payments/payments.service");

exports.getMySubscriptions = catchAsync(async (req, res) => {
  const role = req.query.role || req.user.role;
  const subs = await service.getActiveByUser(req.user.id, role);
  sendSuccess(res, subs);
});

exports.createOrRenewSubscription = catchAsync(async (req, res) => {
  const { plan_id, interval = "monthly", payment_id } = req.body;

  if (!payment_id) {
    throw new AppError("Payment is required", 400);
  }

  const payment = await paymentsService.getById(payment_id);

  if (
    !payment ||
    payment.user_id !== req.user.id ||
    payment.item_type !== "plan" ||
    payment.item_id !== plan_id ||
    payment.status !== paymentsService.STATUS.PAID
  ) {
    throw new AppError("Invalid or unpaid payment", 400);
  }

  const subscription = await service.createOrRenewSubscription({
    user_id: req.user.id,
    plan_id,
    interval,
  });
  sendSuccess(res, subscription);
});

exports.upgradeSubscription = catchAsync(async (req, res) => {
  const subscription = await service.upgradeSubscription(req.user.id);
  if (!subscription) {
    throw new AppError("No active subscription to upgrade", 400);
  }
  sendSuccess(res, subscription);
});

exports.cancelSubscription = catchAsync(async (req, res) => {
  const subscription = await service.cancelSubscription(req.user.id);
  if (!subscription) {
    throw new AppError("No active subscription to cancel", 400);
  }
  sendSuccess(res, subscription);
});
