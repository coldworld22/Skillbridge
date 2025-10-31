const AppError = require("../../../utils/AppError");
const paymentsService = require("../payments.service");
const STATUS = paymentsService?.STATUS || {
  PAID: "paid",
  PENDING_PAYMENT: "pending_payment",
  AWAITING_APPROVAL: "awaiting_approval",
  REJECTED: "rejected",
};
const paymentMethodsService = require("../../paymentMethods/paymentMethods.service");
const paypalService = require("../../../services/paypalService");
const stripeService = require("../../../services/stripeService");
const couponService = require("../../coupons/coupons.service");
const classService = require("../../classes/class.service");
const bookService = require("../../books/book.service");
const tutorialService = require("../../users/tutorials/tutorial.service");
const plansService = require("../../plans/plans.service");

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseDateSafe = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, days) => {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
};

const determineClassInstallmentDueDate = (cls) => {
  const now = new Date();
  const start = parseDateSafe(cls?.start_date) || now;
  const end = parseDateSafe(cls?.end_date);

  let offsetDays = 14;
  if (end && end > start) {
    const durationDays = Math.round((end.getTime() - start.getTime()) / DAY_IN_MS);
    offsetDays = Math.max(7, Math.round(durationDays / 2));
  }

  let candidate = addDays(start, offsetDays);
  if (candidate <= now) {
    candidate = addDays(now, Math.max(7, offsetDays));
  }
  return candidate;
};

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

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    throw new AppError("Invalid amount", 400);
  }

  const wantsInstallments = Boolean(allow_installments);
  let schedules = [];
  let next_due_date = null;
  let totalInstallments = 1;
  let itemAllowsInstallments = false;
  let classInfo = null;
  let installmentNumber = 1;
  let scheduleToClose = null;

  let method;
  if (method_id) {
    method = await paymentMethodsService.getById(method_id);
    if (!method || !method.active) {
      throw new AppError("Invalid payment method", 400);
    }
  } else if (Number(amount) === 0) {
    method = await paymentMethodsService.getByType("free");
    if (!method || !method.active) {
      method = await paymentMethodsService.ensureFreeMethod();
    }
  } else {
    throw new AppError("Missing required fields", 400);
  }

  let verifiedAmount = numericAmount;
  let verifiedCurrency = currency || "USD";
  let finalStatus = numericAmount === 0 ? STATUS.PAID : STATUS.PENDING_PAYMENT;
  if (status && method.type !== "stripe") {
    finalStatus = status;
  }
  let verifiedReference = reference_id;

  if (method.type === "bank") {
    throw new AppError("Bank payments must use the bank transfer API", 400);
  }

  if (method.type !== "free" && numericAmount <= 0) {
    throw new AppError("Invalid amount", 400);
  }

  if (method.type === "free") {
    verifiedAmount = 0;
    finalStatus = STATUS.PAID;
  }

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
  let subscriptionId = null;
  if (item_type === "class") {
    if (typeof classService.getClassById === "function") {
      try {
        classInfo = await classService.getClassById(item_id);
        if (!classInfo) throw new AppError("Class not found", 404);
        basePrice = Number(classInfo.price);
        itemAllowsInstallments = Boolean(classInfo.allow_installments);
      } catch (err) {
        basePrice = null;
        if (err instanceof AppError) {
          throw err;
        }
        throw new AppError("Unable to retrieve class details", 500);
      }
    } else {
      basePrice = null;
    }
  } else if (item_type === "book") {
    let book = null;
    if (typeof bookService.getBookById === "function") {
      book = await bookService.getBookById(item_id);
      if (!book) throw new AppError("Book not found", 404);
      basePrice = Number(book.price);
      itemAllowsInstallments = false;
    } else {
      basePrice = null;
    }
    let activePlanId = null;
    let activeSubscriptionId = null;
    if (userId) {
      try {
        const {
          getActiveStudentSubscription,
          getActiveStudentPlanId,
        } = require("../../plans/subscription.helper");
        let activeSubscription = null;
        if (typeof getActiveStudentSubscription === "function") {
          activeSubscription = await getActiveStudentSubscription(userId);
        }
        if (activeSubscription) {
          activePlanId = activeSubscription.plan_id || null;
          activeSubscriptionId = activeSubscription.subscription_id || null;
        } else if (typeof getActiveStudentPlanId === "function") {
          activePlanId = await getActiveStudentPlanId(userId);
          activeSubscriptionId = null;
        }
      } catch (_) {
        activePlanId = null;
        activeSubscriptionId = null;
      }
    }
    const includedPlans = Array.isArray(book?.included_plans)
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
      subscriptionId = activeSubscriptionId;
      verifiedAmount = 0;
      finalStatus = STATUS.PAID;
      basePrice = null;
    }
  } else if (item_type === "tutorial") {
    if (typeof tutorialService.getTutorialById === "function") {
      const tut = await tutorialService.getTutorialById(item_id);
      if (!tut) throw new AppError("Tutorial not found", 404);
      basePrice = Number(tut.price);
      itemAllowsInstallments = false;
    } else {
      basePrice = null;
    }
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
    if (item_type !== "class") {
      throw new AppError("Installment plan is only available for online classes", 400);
    }
    if (!itemAllowsInstallments) {
      throw new AppError("Installment plan not available for this class", 400);
    }

    const normalizedClassId =
      item_id === undefined || item_id === null ? item_id : String(item_id);

    let existingInstallmentPayment = null;
    let outstandingSchedule = null;
    if (typeof paymentsService.findInstallmentContext === "function") {
      const context = await paymentsService.findInstallmentContext(
        userId,
        item_type,
        normalizedClassId
      );
      if (context) {
        existingInstallmentPayment = context.payment || null;
        outstandingSchedule = context.schedule || null;
      }
    }

    if (existingInstallmentPayment) {
      totalInstallments = existingInstallmentPayment.installments || 2;
      if (outstandingSchedule) {
        installmentNumber =
          Number(outstandingSchedule.installment_number) || 2;
        scheduleToClose = outstandingSchedule;
        schedules = [];
        next_due_date = null;
      } else {
        throw new AppError(
          "Installment plan for this class is already settled",
          400
        );
      }
    } else {
      totalInstallments = 2;
    }
  } else {
    totalInstallments = 1;
  }

  if (basePrice !== null && basePrice !== undefined) {
    if (wantsInstallments && basePrice <= 0) {
      throw new AppError("Installments require a positive class price", 400);
    }
    if (coupon) {
      basePrice = +(basePrice * (1 - coupon.discount_percent / 100)).toFixed(2);
    }
    const expected =
      totalInstallments > 1 ? basePrice / totalInstallments : basePrice;
    if (Math.abs(verifiedAmount - expected) >= EPS) {
      throw new AppError("Payment amount does not match item price", 400);
    }
  }

  if (scheduleToClose) {
    const scheduledAmount = Number(scheduleToClose.amount);
    if (
      Number.isFinite(scheduledAmount) &&
      Math.abs(verifiedAmount - scheduledAmount) >= EPS
    ) {
      throw new AppError(
        "Payment amount does not match outstanding installment",
        400
      );
    }
  }

  if (wantsInstallments && totalInstallments > 1 && !scheduleToClose) {
    const installmentAmount = verifiedAmount;
    const due = determineClassInstallmentDueDate(classInfo);
    schedules = [
      {
        installment_number: 2,
        amount: installmentAmount,
        due_date: due,
      },
    ];
    next_due_date = due;
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
    installmentNumber,
    scheduleToClose,
    subscriptionPlanId,
    subscriptionId,
  };
}

module.exports = { validatePaymentData };
