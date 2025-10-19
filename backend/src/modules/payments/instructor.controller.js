const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const paymentsService = require("./payments.service");
const walletService = require("../payouts/wallet.service");
const payoutsService = require("../payouts/payouts.service");
const logger = require("../../utils/logger.js");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");

const toNumber = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? 0
    : Number(value);

exports.getSummary = catchAsync(async (req, res) => {
  const instructorId = req.user.id;

  const totals = await paymentsService.getInstructorTotals(instructorId);

  let wallet = null;
  let payouts = [];
  let minimumWithdrawalAmount = 0;

  try {
    wallet = await walletService.getByInstructor(instructorId);
  } catch (err) {
    logger.warn("Wallet lookup failed for instructor summary:", err.message);
  }

  try {
    payouts = await payoutsService.getByInstructor(instructorId);
  } catch (err) {
    logger.warn("Payout history lookup failed for instructor summary:", err.message);
  }

  try {
    const config = await paymentConfigService.getSettings();
    if (config) {
      const rawMinimum =
        config.minimumPayoutAmount ??
        config.minimumWithdrawalAmount ??
        config.minimum_payout_amount ??
        config.withdrawalMinimum ??
        config.withdrawal_minimum ??
        0;
      minimumWithdrawalAmount = toNumber(rawMinimum);
    }
  } catch (err) {
    logger.warn(
      "Payment config lookup failed for instructor summary:",
      err.message
    );
  }

  const normalizedPayouts = (payouts || []).map((payout) => ({
    ...payout,
    status: (payout.status || "").toLowerCase(),
  }));

  const withdrawnTotal = normalizedPayouts
    .filter((payout) => payout.status === "approved")
    .reduce((sum, payout) => sum + toNumber(payout.amount), 0);

  const pendingPayoutTotal = normalizedPayouts
    .filter((payout) =>
      ["pending", "processing", "in_review"].includes(payout.status)
    )
    .reduce((sum, payout) => sum + toNumber(payout.amount), 0);

  const reservedPayoutTotal = withdrawnTotal + pendingPayoutTotal;

  const walletBalanceRaw = toNumber(wallet?.balance);
  const computedAvailableBalance = Math.max(
    0,
    toNumber(totals.totalPaid) - reservedPayoutTotal
  );
  const walletBalance =
    walletBalanceRaw > 0 ? walletBalanceRaw : computedAvailableBalance;

  sendSuccess(res, {
    totalPaid: toNumber(totals.totalPaid),
    totalPending: toNumber(totals.totalPending),
    lifetimeEarnings: toNumber(totals.totalInstructorAmount),
    totalPlatformFees: toNumber(totals.totalPlatformFee),
    totalGross: toNumber(totals.totalGross),
    walletBalance,
    withdrawnTotal,
    pendingWithdrawalTotal: pendingPayoutTotal,
    availableForWithdrawal: walletBalance,
    meetsWithdrawalMinimum:
      minimumWithdrawalAmount > 0
        ? walletBalance >= minimumWithdrawalAmount
        : true,
    minimumWithdrawalAmount,
    minimumPayoutAmount: minimumWithdrawalAmount,
  });
});

exports.getPayments = catchAsync(async (req, res) => {
  const instructorId = req.user.id;
  const { status, itemType } = req.query;

  const payments = await paymentsService.getByInstructor(instructorId, {
    status,
    itemType,
  });

  const formatted = payments.map((payment) => ({
    ...payment,
    amount: toNumber(payment.amount),
    platform_fee: toNumber(payment.platform_fee),
    instructor_amount: toNumber(payment.instructor_amount),
    item_price: toNumber(payment.item_price),
  }));

  sendSuccess(res, formatted);
});
