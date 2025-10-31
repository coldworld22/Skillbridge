const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./subscription.service");
const paymentsService = require("../payments/payments.service");
const plansService = require("../plans/plans.service");

exports.getMySubscriptions = catchAsync(async (req, res) => {
  const role = req.query.role || req.user.role;
  const subs = await service.getActiveByUser(req.user.id, role);
  sendSuccess(res, subs);
});

exports.getMySubscriptionSummary = catchAsync(async (req, res) => {
  const summary = await service.getPlanSummaryForUser(req.user.id);
  sendSuccess(res, summary);
});

exports.getMySubscriptionHistory = catchAsync(async (req, res) => {
  const history = await service.getPlanHistoryForUser(req.user.id);
  sendSuccess(res, history);
});

exports.createOrRenewSubscription = catchAsync(async (req, res) => {
  const { plan_id, interval = "monthly", payment_id } = req.body;

  const plan = await plansService.getPlanById(plan_id);
  if (!plan) {
    throw new AppError("Plan not found", 404);
  }

  const normalizedInterval =
    typeof interval === "string" && interval.toLowerCase() === "yearly"
      ? "yearly"
      : "monthly";
  const priceMonthly = Number(plan.price_monthly) || 0;
  const priceYearly = Number(plan.price_yearly) || 0;
  const planPrice =
    normalizedInterval === "yearly" ? priceYearly : priceMonthly;

  let payment = null;

  if (payment_id) {
    payment = await paymentsService.getById(payment_id);
  }

  if (payment) {
    if (
      payment.user_id !== req.user.id ||
      payment.item_type !== "plan" ||
      payment.item_id !== plan_id ||
      payment.status !== paymentsService.STATUS.PAID
    ) {
      throw new AppError("Invalid or unpaid payment", 400);
    }
  } else if (planPrice > 0) {
    throw new AppError("Payment is required", 400);
  }

  const subscription = await service.createOrRenewSubscription({
    user_id: req.user.id,
    plan_id,
    interval: normalizedInterval,
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
