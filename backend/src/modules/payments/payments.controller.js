const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payments.service");
const { STATUS } = service;
const { v4: uuidv4 } = require("uuid");
const smsService = require("../../services/smsService");
const userModel = require("../users/user.model");
const libraryService = require("../library/library.service");
const enrollmentService = require("../classes/enrollments/classEnrollment.service");
const tutorialEnrollmentService = require("../users/tutorials/enrollments/tutorialEnrollment.service");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");
const paymentMethodsService = require("../paymentMethods/paymentMethods.service");
const paypalService = require("../../services/paypalService");
const notificationService = require("../notifications/notifications.service");
const mailService = require("../../services/mailService");
const couponService = require("../coupons/coupons.service");
const plansService = require("../plans/plans.service");
const subscriptionService = require("../subscriptions/subscription.service");

const DEFAULT_PLATFORM_CUT = {
  class: 15,
  book: 10,
  tutorial: 20,
};

exports.createPayment = catchAsync(async (req, res) => {
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
    receipt_url,
    coupon_id,
  } = req.body;

  const user_id = req.user.id;

  if (!method_id || !item_type || !item_id || !amount) {
    throw new AppError("Missing required fields", 400);
  }

  let schedules = [];
  let next_due_date = null;
  let totalInstallments = allow_installments ? installments || 1 : 1;
  if (allow_installments && totalInstallments > 1) {
    for (let i = 2; i <= totalInstallments; i++) {
      const due = new Date();
      due.setMonth(due.getMonth() + (i - 1));
      schedules.push({
        installment_number: i,
        amount,
        due_date: due,
      });
    }
    next_due_date = schedules[0]?.due_date || null;
  }

  const method = await paymentMethodsService.getById(method_id);
  if (!method || !method.active) {
    throw new AppError("Invalid payment method", 400);
  }

  let verifiedAmount = amount;
  let verifiedCurrency = currency || "USD";
  let finalStatus = status || STATUS.PENDING_PAYMENT;
  let verifiedReference = reference_id;

  if (method.type === "paypal") {
    if (!reference_id) throw new AppError("Missing PayPal order ID", 400);
    const capture = await paypalService.captureOrder(reference_id);
    if (capture.status !== "COMPLETED") {
      throw new AppError("PayPal transaction not completed", 400);
    }
    const info =
      capture.purchase_units?.[0]?.payments?.captures?.[0] || {};
    verifiedAmount = parseFloat(info.amount?.value || amount);
    verifiedCurrency = info.amount?.currency_code || verifiedCurrency;
    verifiedReference = info.id || reference_id;
    finalStatus = STATUS.PAID;
  }

  if (coupon_id) {
    const coupon = await couponService.getCouponById(coupon_id);
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

  let platform_fee = 0;
  let instructor_amount = verifiedAmount;
  try {
    const settings = await paymentConfigService.getSettings();
    const cut =
      settings?.platformCut?.[item_type] ??
      DEFAULT_PLATFORM_CUT[item_type] ??
      0;
    platform_fee = (verifiedAmount * cut) / 100;
    instructor_amount = verifiedAmount - platform_fee;
  } catch (err) {
    logger.error("Failed to load payment settings:", err);
  }

  const createData = {
    id: uuidv4(),
    user_id,
    method_id,
    item_type,
    item_id,
    amount: verifiedAmount,
    currency: verifiedCurrency,
    status: finalStatus,
    reference_id: verifiedReference,
    receipt_url,
    platform_fee,
    instructor_amount,
    paid_at: finalStatus === STATUS.PAID ? new Date() : null,
    installments: totalInstallments,
    installment_number: 1,
    next_due_date,
  };
  const createArgs = [createData];
  if (schedules.length) createArgs.push(schedules);
  const payment = await service.create(...createArgs);

  if (coupon_id && payment.status === STATUS.PAID) {
    try {
      await couponService.incrementUsage(coupon_id);
    } catch (err) {
      logger.error("Failed to increment coupon usage:", err);
    }
  }

  let user;
  try {
    user = await userModel.findById(user_id);
    if (user?.phone) {
      const text = `Payment of ${verifiedAmount} received. Ref: ${payment.reference_id}`;
      await smsService.sendSMS({ to: user.phone, text });
    }
  } catch (err) {
    logger.error("Failed to send payment SMS:", err);
  }

  if (method.type === "bank" && user?.email) {
    try {
      const bank = method.settings || {};
      const html = `
        <p>Dear ${user.full_name || ""},</p>
        <p>Please complete your payment via bank transfer using the details below:</p>
        <ul>
          <li><strong>Bank:</strong> ${bank.bank_name || ""}</li>
          <li><strong>Account Number:</strong> ${bank.account_number || ""}</li>
          <li><strong>IBAN:</strong> ${bank.iban || ""}</li>
        </ul>
        <p>${bank.instructions || ""}</p>
      `;
      await mailService.sendMail({
        to: user.email,
        subject: "Payment Invoice",
        html,
      });
    } catch (err) {
      logger.error("Failed to send invoice email:", err);
    }
  }

  if (item_type === "book" && payment.status === STATUS.PAID) {
    try {
      await libraryService.recordPurchase(user_id, item_id, verifiedAmount);
    } catch (err) {
      logger.error("Failed to record book purchase:", err);
    }
  }

  if (item_type === "class" && payment.status === STATUS.PAID) {
    try {
        await enrollmentService.createEnrollment({
          id: uuidv4(),
          user_id,
          class_id: item_id,
          status: "enrolled",
        });
    } catch (err) {
      logger.error("Failed to enroll after payment:", err);
    }
  }

  if (item_type === "tutorial" && payment.status === STATUS.PAID) {
    try {
      await tutorialEnrollmentService.createEnrollment({
        id: uuidv4(),
        user_id,
        tutorial_id: item_id,
        status: "enrolled",
      });
    } catch (err) {
      logger.error("Failed to enroll in tutorial after payment:", err);
    }
  }

  if (item_type === "plan" && payment.status === STATUS.PAID) {
    try {
      const plan = await plansService.getPlanById(item_id);
      if (plan) {
        const interval =
          Number(verifiedAmount) === Number(plan.price_yearly)
            ? "yearly"
            : "monthly";
        await subscriptionService.createOrRenewSubscription({
          user_id,
          plan_id: item_id,
          interval,
        });
      }
    } catch (err) {
      logger.error("Failed to activate subscription after payment:", err);
    }
  }

  sendSuccess(res, payment, "Payment created");
});

exports.uploadReceipt = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const url = `/uploads/payment-receipts/${req.file.filename}`;
  sendSuccess(res, { url }, "Receipt uploaded");
});

exports.confirmPayment = catchAsync(async (req, res) => {
  const payment = await service.getById(req.params.id);
  if (!payment || payment.user_id !== req.user.id) {
    throw new AppError("Payment not found", 404);
  }
  const { receipt_url, reference_id } = req.body;
  const updateData = {
    status: STATUS.AWAITING_APPROVAL,
    receipt_url,
  };
  if (reference_id) {
    updateData.reference_id = reference_id;
  }
  const updated = await service.update(req.params.id, updateData);
  sendSuccess(res, updated, "Payment confirmation submitted");

  try {
    const admins = await userModel.findAdmins();
    await Promise.all(
      admins.map((admin) =>
        notificationService.createNotification({
          user_id: admin.id,
          type: "payment_confirmation",
          message: `Payment ${payment.id} pending review`,
        })
      )
    );
  } catch (err) {
    logger.error("Failed to notify admins of payment confirmation:", err);
  }
});

exports.getPayments = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.getMyPayments = catchAsync(async (req, res) => {
  const data = await service.getByUser(req.user.id);
  sendSuccess(res, data);
});

exports.getPayment = catchAsync(async (req, res) => {
  const payment = await service.getById(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);
  sendSuccess(res, payment);
});

exports.updatePayment = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  const payment = await service.update(req.params.id, req.body);
  if (!payment) throw new AppError("Payment not found", 404);
  sendSuccess(res, payment, "Payment updated");

  if (existing && req.body.status && req.body.status !== existing.status) {
    try {
      const user = await userModel.findById(payment.user_id);
      let message = "";
      let subject = "";
      if (req.body.status === STATUS.PAID) {
        message = `Your payment ${payment.id} has been approved.`;
        subject = "Payment Approved";
      } else if (req.body.status === STATUS.REJECTED) {
        message = `Your payment ${payment.id} has been rejected.`;
        subject = "Payment Rejected";
      }
      if (message) {
        await notificationService.createNotification({
          user_id: payment.user_id,
          type: "payment_status",
          message,
        });
        if (user?.email) {
          await mailService.sendMail({
            to: user.email,
            subject,
            html: `<p>${message}</p>`,
          });
        }
      }
    } catch (err) {
      logger.error("Failed to notify student of payment status:", err);
    }
  }
});

exports.deletePayment = catchAsync(async (req, res) => {
  await service.delete(req.params.id);
  sendSuccess(res, null, "Payment deleted");
});
