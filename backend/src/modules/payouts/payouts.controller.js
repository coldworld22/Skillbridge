const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payouts.service");
const { v4: uuidv4 } = require("uuid");
const walletService = require("./wallet.service");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");
const logger = require("../../utils/logger");
const paymentsService = require("../payments/payments.service");

const toNumber = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? 0
    : Number(value);

exports.createPayout = catchAsync(async (req, res) => {
  const { instructor_id, amount, currency, status, notes } = req.body;
  if (!instructor_id || !amount) {
    throw new AppError("Instructor and amount are required", 400);
  }
  const payout = await service.create({
    id: uuidv4(),
    instructor_id,
    amount,
    currency: currency || "USD",
    status: status || "pending",
    notes,
  });
  sendSuccess(res, payout, "Payout request created");
});

exports.getPayouts = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.getPayout = catchAsync(async (req, res) => {
  const payout = await service.getById(req.params.id);
  if (!payout) throw new AppError("Payout not found", 404);
  sendSuccess(res, payout);
});

exports.updatePayout = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError("Payout not found", 404);

  const updateData = { ...req.body };
  if (req.body.status === "approved" && existing.status !== "approved") {
    try {
      await walletService.decrement(existing.instructor_id, existing.amount);
    } catch (err) {
      if (err.message === "Insufficient balance") {
        throw new AppError("Insufficient wallet balance", 400);
      }
      throw err;
    }
    updateData.processed_at = new Date();
  }
  const payout = await service.update(req.params.id, updateData);
  sendSuccess(res, payout, "Payout updated");
});

exports.deletePayout = catchAsync(async (req, res) => {
  await service.delete(req.params.id);
  sendSuccess(res, null, "Payout deleted");
});

// Instructor: Get wallet balance
exports.getWallet = catchAsync(async (req, res) => {
  const wallet = await walletService.getByInstructor(req.user.id);
  sendSuccess(res, wallet || { balance: 0 });
});

// Instructor: Get payout history
exports.getMyPayouts = catchAsync(async (req, res) => {
  const payouts = await service.getByInstructor(req.user.id);
  sendSuccess(res, payouts);
});

// Instructor: Request payout for self after validating funds
exports.requestPayout = catchAsync(async (req, res) => {
  const { amount, currency, notes, instructor_id } = req.body;

  if (instructor_id && instructor_id !== req.user.id) {
    throw new AppError("Cannot request payout for another instructor", 403);
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError("Amount is required", 400);
  }

  let minimumWithdrawalAmount = 0;
  try {
    const config = await paymentConfigService.getSettings();
    if (config) {
      const rawMinimum =
        config.minimumPayoutAmount ??
        config.minimumWithdrawalAmount ??
        config.withdrawalMinimum ??
        0;
      const parsed = Number(rawMinimum);
      if (Number.isFinite(parsed) && parsed > 0) {
        minimumWithdrawalAmount = parsed;
      }
    }
  } catch (err) {
    logger.warn(
      "Payment config lookup failed for payout request:",
      err?.message
    );
  }

  const wallet = await walletService.getByInstructor(req.user.id);
  const payouts = await service.getByInstructor(req.user.id);
  const normalizedPayouts = (payouts || []).map((p) => ({
    ...p,
    status: (p.status || "").toLowerCase(),
  }));
  const withdrawnTotal = normalizedPayouts
    .filter((payout) => payout.status === "approved")
    .reduce((sum, payout) => sum + toNumber(payout.amount), 0);
  const pendingPayoutTotal = normalizedPayouts
    .filter((payout) =>
      ["pending", "processing", "in_review"].includes(payout.status)
    )
    .reduce((sum, payout) => sum + toNumber(payout.amount), 0);
  const reservedTotal = withdrawnTotal + pendingPayoutTotal;

  const totals = await paymentsService.getInstructorTotals(req.user.id);
  const totalPaid = toNumber(totals.totalPaid);

  const computedAvailable = Math.max(0, totalPaid - reservedTotal);
  const normalizedComputedAvailable = Math.max(0, computedAvailable);

  let effectiveBalance = Math.max(0, toNumber(wallet?.balance));
  if (effectiveBalance <= 0) {
    effectiveBalance = normalizedComputedAvailable;
  } else {
    effectiveBalance = Math.min(effectiveBalance, normalizedComputedAvailable);
  }
  effectiveBalance = Math.max(0, effectiveBalance);

  const meetsMinimumBalance =
    minimumWithdrawalAmount > 0
      ? effectiveBalance >= minimumWithdrawalAmount
      : true;

  if (!meetsMinimumBalance) {
    throw new AppError(
      `Minimum withdrawal amount is ${minimumWithdrawalAmount}. Available balance is ${effectiveBalance}.`,
      400
    );
  }

  if (minimumWithdrawalAmount > 0 && numericAmount < minimumWithdrawalAmount) {
    throw new AppError(
      `Minimum withdrawal amount is ${minimumWithdrawalAmount}`,
      400
    );
  }

  if (!Number.isFinite(effectiveBalance) || effectiveBalance < numericAmount) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  const payout = await service.create({
    id: uuidv4(),
    instructor_id: req.user.id,
    amount: numericAmount,
    currency: currency || "USD",
    status: "pending",
    notes,
  });

  sendSuccess(res, payout, "Payout request created");
});
