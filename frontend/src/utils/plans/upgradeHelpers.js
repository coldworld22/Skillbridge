// utils/plans/upgradeHelpers.js

const toPriceOrNull = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

export const getPlanComparablePrice = (plan) => {
  if (!plan) return 0;
  const monthly = toPriceOrNull(plan.price_monthly);
  if (monthly !== null) {
    return monthly;
  }
  const yearly = toPriceOrNull(plan.price_yearly);
  if (yearly !== null) {
    return yearly / 12;
  }
  return 0;
};

export const planRequiresPayment = (plan) => {
  if (!plan) return false;
  const monthly = toPriceOrNull(plan.price_monthly);
  const yearly = toPriceOrNull(plan.price_yearly);
  return (monthly !== null && monthly > 0) || (yearly !== null && yearly > 0);
};

export const pickDefaultInterval = (plan) => {
  if (!plan) return "monthly";
  const monthly = toPriceOrNull(plan.price_monthly);
  const yearly = toPriceOrNull(plan.price_yearly);
  if (monthly !== null && monthly > 0) {
    return "monthly";
  }
  if (yearly !== null && yearly > 0) {
    return "yearly";
  }
  if (monthly !== null) {
    return "monthly";
  }
  if (yearly !== null) {
    return "yearly";
  }
  return "monthly";
};

export const findUpgradeTargetPlan = (plans = [], currentPlan) => {
  if (!Array.isArray(plans) || plans.length === 0) {
    return null;
  }

  const currentComparablePrice =
    currentPlan !== undefined && currentPlan !== null
      ? getPlanComparablePrice(currentPlan)
      : Number.NEGATIVE_INFINITY;

  const candidates = plans
    .filter((plan) => plan && (!currentPlan?.id || plan.id !== currentPlan.id))
    .sort(
      (a, b) => getPlanComparablePrice(a) - getPlanComparablePrice(b)
    );

  const target = candidates.find(
    (plan) => getPlanComparablePrice(plan) > currentComparablePrice
  );

  return target || null;
};

export default {
  getPlanComparablePrice,
  planRequiresPayment,
  pickDefaultInterval,
  findUpgradeTargetPlan,
};
