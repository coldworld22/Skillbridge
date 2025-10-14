const AppError = require("../../../utils/AppError");
const { STATUS } = require("../payments.service");
const paymentMethodsService = require("../../paymentMethods/paymentMethods.service");
const paypalService = require("../../../services/paypalService");
const stripeService = require("../../../services/stripeService");
const couponService = require("../../coupons/coupons.service");
const classService = require("../../classes/class.service");
const bookService = require("../../books/book.service");
const tutorialService = require("../../users/tutorials/tutorial.service");
const plansService = require("../../plans/plans.service");

async function validatePaymentData(body, userId) {
  const {
    method_id,
    item_type,
    item_id,
    amount,
    currency,
    status,
    reference_id,
    allow_installments,
    installments,
    coupon_id,
  } = body;

  if (amount === undefined || amount === null || !item_type || !item_id) {
    throw new AppError("Missing required fields", 400);
  }

  const wantsInstallments = Boolean(allow_installments);
  const requestedInstallments = Number(installments);
  let schedules = [];
  let next_due_date = null;
  let totalInstallments = 1;
  let itemAllowsInstallments = false;
  let itemInstallmentsSetting = null;

  let method;
  if (method_id) {
    method = await paymentMethodsService.getById(method_id);
    if (!method || !method.active) {
      throw new AppError("Invalid payment method", 400);
    }
  } else if (Number(amount) === 0) {
    method = await paymentMethodsService.getByType("free");
    if (!method) {
      method = { id: null, type: "free", active: true };
    } else if (!method.active) {
      throw new AppError("Invalid payment method", 400);
    }
  } else {
    throw new AppError("Missing required fields", 400);
  }

  let verifiedAmount = amount;
  let verifiedCurrency = currency || "USD";
  let finalStatus = Number(amount) === 0 ? STATUS.PAID : STATUS.PENDING_PAYMENT;
  if (status && method.type !== "stripe") {
    finalStatus = status;
  }
  let verifiedReference = reference_id;

  if (method.type === "paypal") {
    if (!reference_id) throw new AppError("Missing PayPal order ID", 400);
    const capture = await paypalService.captureOrder(reference_id);
    if (capture.status !== "COMPLETED") {
      throw new AppError("PayPal transaction not completed", 400);
    }
    const info = capture.purchase_units?.[0]?.payments?.captures?.[0] || {};
    verifiedAmount = parseFloat(info.amount?.value || amount);
    verifiedCurrency = info.amount?.currency_code || verifiedCurrency;
    verifiedReference = info.id || reference_id;
    finalStatus = STATUS.PAID;
  } else if (method.type === "stripe") {
    if (!body.token) throw new AppError("Missing Stripe token", 400);
    let charge;
    try {
      charge = await stripeService.charge({
        token: body.token,
        amount,
        currency: verifiedCurrency,
      });
    } catch (_) {
      throw new AppError("Stripe charge failed", 400);
    }
    if (charge.status !== "succeeded") {
      throw new AppError("Stripe charge failed", 400);
    }
    verifiedAmount = charge.amount ? charge.amount / 100 : verifiedAmount;
    verifiedCurrency = charge.currency
      ? charge.currency.toUpperCase()
      : verifiedCurrency;
    verifiedReference = charge.id;
    finalStatus = STATUS.PAID;
  }

  let coupon = null;
  if (coupon_id) {
    coupon = await couponService.getCouponById(coupon_id);
    if (!coupon) throw new AppError("Invalid coupon", 400);
    if (coupon.applies_to && coupon.applies_to !== item_type) {
      throw new AppError("Coupon not valid for this item type", 400);
    }
    if (coupon.applies_to_id && coupon.applies_to_id !== item_id) {
      throw new AppError("Coupon not valid for this item", 400);
    }
    if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
      throw new AppError("Coupon not active", 400);
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new AppError("Coupon expired", 400);
    }
    if (
      coupon.usage_limit !== null &&
      coupon.times_used >= coupon.usage_limit
    ) {
      throw new AppError("Coupon usage limit reached", 400);
    }
  }

  const EPS = 0.01;
  let planInterval = null;
  let basePrice;

  let subscriptionPlanId = null;
  if (item_type === "class") {
    const cls = await classService.getClassById(item_id);
    if (!cls) throw new AppError("Class not found", 404);
    basePrice = Number(cls.price);
    itemAllowsInstallments = Boolean(cls.allow_installments);
    itemInstallmentsSetting = cls.installments ?? null;
  } else if (item_type === "book") {
    const book = await bookService.getBookById(item_id);
    if (!book) throw new AppError("Book not found", 404);
    basePrice = Number(book.price);
    itemAllowsInstallments = Boolean(book.allow_installments);
    itemInstallmentsSetting = book.installments ?? null;
    let activePlanId = null;
    if (userId) {
      try {
        const { getActiveStudentPlanId } = require("../../plans/subscription.helper");
        activePlanId = await getActiveStudentPlanId(userId);
      } catch (_) {
        activePlanId = null;
      }
    }
    const includedPlans = Array.isArray(book.included_plans)
      ? book.included_plans
      : [];
    const coveredBySubscription =
      activePlanId && includedPlans.includes(activePlanId);
    if (coveredBySubscription) {
      if (Number(amount) !== 0) {
        throw new AppError(
          "Amount must be 0 for plan-covered items",
          400
        );
      }
      subscriptionPlanId = activePlanId;
      verifiedAmount = 0;
      finalStatus = STATUS.PAID;
      basePrice = null;
    }
  } else if (item_type === "tutorial") {
    const tut = await tutorialService.getTutorialById(item_id);
    if (!tut) throw new AppError("Tutorial not found", 404);
    basePrice = Number(tut.price);
    itemAllowsInstallments = Boolean(tut.allow_installments);
    itemInstallmentsSetting = tut.installments ?? null;
  } else if (item_type === "plan") {
    const plan = await plansService.getPlanById(item_id);
    if (!plan) throw new AppError("Plan not found", 404);
    let monthly = Number(plan.price_monthly);
    let yearly = Number(plan.price_yearly);
    if (coupon) {
      monthly = +(monthly * (1 - coupon.discount_percent / 100)).toFixed(2);
      yearly = +(yearly * (1 - coupon.discount_percent / 100)).toFixed(2);
    }
    const perMonthly =
      totalInstallments > 1 ? monthly / totalInstallments : monthly;
    const perYearly =
      totalInstallments > 1 ? yearly / totalInstallments : yearly;
    if (Math.abs(verifiedAmount - perYearly) < EPS) {
      planInterval = "yearly";
    } else if (Math.abs(verifiedAmount - perMonthly) < EPS) {
      planInterval = "monthly";
    } else {
      throw new AppError("Payment amount does not match plan price", 400);
    }
    basePrice = null;
  }

  if (wantsInstallments) {
    if (!itemAllowsInstallments) {
      throw new AppError("Installment plan not available for this item", 400);
    }
    if (Number.isFinite(requestedInstallments) && requestedInstallments > 1) {
      totalInstallments = Math.floor(requestedInstallments);
    } else if (
      Number.isFinite(Number(itemInstallmentsSetting)) &&
      Number(itemInstallmentsSetting) > 1
    ) {
      totalInstallments = Math.floor(Number(itemInstallmentsSetting));
    } else {
      totalInstallments = 2;
    }
  } else {
    totalInstallments = 1;
  }

  if (basePrice !== null && basePrice !== undefined) {
    if (coupon) {
      basePrice = +(basePrice * (1 - coupon.discount_percent / 100)).toFixed(2);
    }
    const expected =
      totalInstallments > 1 ? basePrice / totalInstallments : basePrice;
    if (Math.abs(verifiedAmount - expected) >= EPS) {
      throw new AppError("Payment amount does not match item price", 400);
    }
  }

  if (wantsInstallments && totalInstallments > 1) {
    const installmentAmount = verifiedAmount;
    schedules = [];
    for (let i = 2; i <= totalInstallments; i++) {
      const due = new Date();
      due.setMonth(due.getMonth() + (i - 1));
      schedules.push({
        installment_number: i,
        amount: installmentAmount,
        due_date: due,
      });
    }
    next_due_date = schedules[0]?.due_date || null;
  }

  return {
    method,
    verifiedAmount,
    verifiedCurrency,
    finalStatus,
    verifiedReference,
    coupon,
    planInterval,
    schedules,
    next_due_date,
    totalInstallments,
    subscriptionPlanId,
  };
}

module.exports = { validatePaymentData };
