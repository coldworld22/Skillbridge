const AppError = require("../../../utils/AppError");
const plansService = require("../../plans/plans.service");

const EPS = 0.01;

function applyDiscount(amount, coupon) {
  if (!coupon) return Number(amount);
  const percent = Number(coupon.discount_percent) || 0;
  const factor = 1 - percent / 100;
  return Number((Number(amount) * factor).toFixed(2));
}

/**
 * Ensures that the submitted amount matches one of the plan's published prices
 * (monthly or yearly), taking coupon discounts and installments into account.
 * Returns the resolved interval ("monthly" | "yearly") and the normalized amount
 * for that interval.
 */
async function ensurePlanAmountMatches(planId, amount, { coupon = null, installments = 1 } = {}) {
  const plan = await plansService.getPlanById(planId);
  if (!plan) throw new AppError("Plan not found", 404);

  const rawMonthly = Number(plan.price_monthly);
  const rawYearly = Number(plan.price_yearly);
  const monthly = applyDiscount(rawMonthly, coupon);
  const yearly = applyDiscount(rawYearly, coupon);

  const divisor = Number.isFinite(installments) && installments > 1 ? installments : 1;
  const perInstallmentMonthly = Number((monthly / divisor).toFixed(2));
  const perInstallmentYearly = Number((yearly / divisor).toFixed(2));

  if (Math.abs(Number(amount) - perInstallmentMonthly) < EPS) {
    return { interval: "monthly", normalizedAmount: perInstallmentMonthly };
  }
  if (Math.abs(Number(amount) - perInstallmentYearly) < EPS) {
    return { interval: "yearly", normalizedAmount: perInstallmentYearly };
  }

  throw new AppError("Payment amount does not match plan price", 400);
}

module.exports = { ensurePlanAmountMatches };
