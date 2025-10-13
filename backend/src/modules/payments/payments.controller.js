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
const { grantAccess } = require("./paymentAccess");
const notificationService = require("../notifications/notifications.service");
const mailService = require("../../services/mailService");
const couponService = require("../coupons/coupons.service");
const plansService = require("../plans/plans.service");
const subscriptionService = require("../subscriptions/subscription.service");
const invoiceService = require("../invoices/invoices.service");
const paymentMethodsService = require("../paymentMethods/paymentMethods.service");
const { validatePaymentData } = require("./helpers/validation");
const { calculatePlatformFee } = require("./helpers/platformFee");
const { handleEnrollment } = require("./helpers/enrollment");
const {
  creditInstructorFromPayment,
  creditInstructorSubscription,
  creditInstructorWallet,
} = require("./helpers/wallet");

exports.createPayment = catchAsync(async (req, res) => {
  const { method_id, item_type, item_id, receipt_url, coupon_id } = req.body;

  const user_id = req.user.id;

  const validation = await validatePaymentData(req.body, user_id);
  const {
    method,
    verifiedAmount,
    verifiedCurrency,
    finalStatus,
    verifiedReference,
    planInterval,
    schedules,
    next_due_date,
    totalInstallments,
    subscriptionPlanId,
  } = validation;

  let statusToUse = finalStatus;
  if (method?.type === "stripe" && finalStatus !== STATUS.PAID) {
    statusToUse = STATUS.PENDING_PAYMENT;
  }

  const { platform_fee, instructor_amount } = await calculatePlatformFee(
    item_type,
    verifiedAmount
  );

  const createData = {
    id: uuidv4(),
    user_id,
    method_id: method?.id || method_id || null,
    item_type,
    item_id,
    amount: verifiedAmount,
    currency: verifiedCurrency,
    status: statusToUse,
    reference_id: verifiedReference,
    receipt_url,
    platform_fee,
    instructor_amount,
    paid_at: statusToUse === STATUS.PAID ? new Date() : null,
    installments: totalInstallments,
    installment_number: 1,
    next_due_date,
  };
  if (subscriptionPlanId) {
    createData.source = 'subscription';
  }
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

  // Bank payments are handled separately via /payments/bank/initiate

  if (item_type === "book" && payment.status === STATUS.PAID) {
    try {
      await libraryService.recordPurchase(user_id, item_id, verifiedAmount);
    } catch (err) {
      logger.error("Failed to record book purchase:", err);
    }
  }

  if (subscriptionPlanId && item_type === "book") {
    try {
      const db = require("../../config/database");
      const usage = await db("plan_usage_metrics")
        .where({ plan_id: subscriptionPlanId, item_type: "book", item_id })
        .first();
      if (usage) {
        await db("plan_usage_metrics")
          .where({ plan_id: subscriptionPlanId, item_type: "book", item_id })
          .update({ usage_count: usage.usage_count + 1 });
      } else {
        await db("plan_usage_metrics").insert({
          plan_id: subscriptionPlanId,
          item_type: "book",
          item_id,
          usage_count: 1,
        });
      }
      await creditInstructorSubscription("book", item_id, subscriptionPlanId);
    } catch (err) {
      logger.error("Failed to record subscription usage:", err);
    }
  }

  if (payment.status === STATUS.PAID) {
    await creditInstructorWallet(item_type, item_id, instructor_amount);
    await handleEnrollment(item_type, user_id, item_id);
  }

  if (item_type === "plan" && payment.status === STATUS.PAID) {
    try {
      const plan = await plansService.getPlanById(item_id);
      if (plan) {
        const interval =
          planInterval ||
          (Number(verifiedAmount) === Number(plan.price_yearly)
            ? "yearly"
            : "monthly");
        const subscription = await subscriptionService.createOrRenewSubscription({
          user_id,
          plan_id: item_id,
          interval,
        });

        try {
          const start = new Date(subscription.start_date).toLocaleDateString();
          const end = new Date(subscription.end_date).toLocaleDateString();
          const message = `Your ${plan.name} plan is active from ${start} to ${end}.`;

          await notificationService.createNotification({
            user_id,
            type: "plan_subscription",
            message,
          });

          if (user?.email) {
            await mailService.sendMail({
              to: user.email,
              subject: "Subscription Activated",
              html: `<p>${message}</p>`,
            });
          }
        } catch (err) {
          logger.error("Failed to send subscription notification:", err);
        }
      }
    } catch (err) {
      logger.error("Failed to activate subscription after payment:", err);
    }
  }

  if (payment.status === STATUS.PAID) {
    try {
      if (!user) {
        user = await userModel.findById(user_id);
      }
      const invoice = await invoiceService.generateFromPayment(payment, user);
      if (user?.email && !user?.invoice_email_opt_out && invoice?.pdf_url) {
        await mailService.sendMail({
          to: user.email,
          subject: "Payment Invoice",
          html: `<p>Please find your invoice attached.</p>`,
          attachments: [{ path: invoice.pdf_url }],
        });
      }
    } catch (err) {
      logger.error("Failed to generate invoice:", err);
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

exports.getMyPayment = catchAsync(async (req, res) => {
  const payment = await service.getById(req.params.id);
  if (!payment || payment.user_id !== req.user.id)
    throw new AppError("Payment not found", 404);
  sendSuccess(res, payment);
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
        // Ensure the user gets access to the purchased item when an admin
        // marks a payment as PAID from the generic payments admin. Other
        // payment flows (bank/PayPal/crypto) already call grantAccess.
        try {
          await grantAccess(payment);
        } catch (err) {
          logger.error("Failed to grant access after admin approval:", err);
        }
        message = `Your payment ${payment.id} has been approved.`;
        subject = "Payment Approved";
        try {
          const invoice = await invoiceService.generateFromPayment(payment, user);
          if (user?.email && !user?.invoice_email_opt_out && invoice?.pdf_url) {
            await mailService.sendMail({
              to: user.email,
              subject: "Payment Invoice",
              html: `<p>Please find your invoice attached.</p>`,
              attachments: [{ path: invoice.pdf_url }],
            });
          }
        } catch (err) {
          logger.error("Failed to generate invoice:", err);
        }
        await creditInstructorFromPayment(payment);
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
