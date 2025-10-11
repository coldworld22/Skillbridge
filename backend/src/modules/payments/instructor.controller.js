const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const paymentsService = require("./payments.service");
const walletService = require("../payouts/wallet.service");
const payoutsService = require("../payouts/payouts.service");
const logger = require("../../utils/logger.js");

const toNumber = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? 0
    : Number(value);

exports.getSummary = catchAsync(async (req, res) => {
  const instructorId = req.user.id;

  const totals = await paymentsService.getInstructorTotals(instructorId);

  let wallet = null;
  let payouts = [];

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

  const withdrawnTotal = (payouts || [])
    .filter((payout) => payout.status === "approved")
    .reduce((sum, payout) => sum + toNumber(payout.amount), 0);

  sendSuccess(res, {
    totalPaid: toNumber(totals.totalPaid),
    totalPending: toNumber(totals.totalPending),
    lifetimeEarnings: toNumber(totals.totalInstructorAmount),
    totalPlatformFees: toNumber(totals.totalPlatformFee),
    totalGross: toNumber(totals.totalGross),
    walletBalance: toNumber(wallet?.balance),
    withdrawnTotal,
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
