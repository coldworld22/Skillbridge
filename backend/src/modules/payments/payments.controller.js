const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payments.service");
const STATUS = service?.STATUS || {
  PAID: "paid",
  PENDING_PAYMENT: "pending_payment",
  AWAITING_APPROVAL: "awaiting_approval",
  REJECTED: "rejected",
};
const { v4: uuidv4 } = require("uuid");
const smsService = require("../../services/smsService");
const userModel = require("../users/user.model");
const libraryService = require("../library/library.service");
const { grantAccess } = require("./paymentAccess");
const notificationService = require("../notifications/notifications.service");
const mailService = require("../../services/mailService");
const plansService = require("../plans/plans.service");
const subscriptionService = require("../subscriptions/subscription.service");
const invoiceService = require("../invoices/invoices.service");
const paymentMethodsService = require("../paymentMethods/paymentMethods.service");
const cartService = require("../cart/cart.service");
const { validatePaymentData } = require("./helpers/validation");
const { calculatePlatformFee } = require("./helpers/platformFee");
const { handleEnrollment } = require("./helpers/enrollment");
const {
  creditInstructorFromPayment,
  creditInstructorSubscription,
  creditInstructorWallet,
} = require("./helpers/wallet");
const paymentScheduleService = require("./paymentSchedule.service");
const { markCouponRedeemed } = require("./helpers/coupon");
const db = require("../../config/database");
const resolveInvoicePath = (invoice) => {
  if (!invoice) return null;
  if (invoice.file_path) return invoice.file_path;
  if (!invoice.pdf_url) return null;
  return invoice.pdf_url;
};

const clearCartItem = async (userId, itemId, itemType) => {
  try {
    const normalizedId =
      itemId === undefined || itemId === null ? itemId : String(itemId);
    await cartService.remove(userId, normalizedId, itemType);
  } catch (err) {
    logger.error("Failed to clear cart item after payment:", err);
  }
};

exports.createPayment = catchAsync(async (req, res) => {
  const { method_id, item_type, item_id, receipt_url } = req.body;

  const user_id = req.user.id;
  const tenant_id = req.tenant?.id || null;

  const allowStatusOverride =
    req.user?.role && ["admin", "superadmin"].includes(req.user.role);
  const validation = await validatePaymentData(req.body, user_id, {
    allowStatusOverride,
  });
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
    installmentNumber,
    scheduleToClose,
    subscriptionPlanId,
    subscriptionId,
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
    tenant_id,
    platform_fee,
    instructor_amount,
    paid_at: statusToUse === STATUS.PAID ? new Date() : null,
    installments: totalInstallments,
    installment_number: installmentNumber || 1,
    next_due_date,
    coupon_id: validation.couponId || null,
  };
  if (item_type === "plan") {
    createData.source = "plan";
  } else if (subscriptionPlanId && subscriptionId) {
    createData.source = "subscription";
  }
  const createArgs = [createData];
  if (schedules.length) createArgs.push(schedules);
  const payment = await service.create(...createArgs);

  if (scheduleToClose) {
    try {
      if (payment.status === STATUS.PAID) {
        await paymentScheduleService.markPaid(scheduleToClose.id);
        if (scheduleToClose.payment_id) {
          await db("payments")
            .where({ id: scheduleToClose.payment_id })
            .update({ next_due_date: null, updated_at: new Date() });
        }
      }
    } catch (err) {
      logger.error(
        "Failed to finalize installment schedule after payment:",
        err
      );
    }
  }

  if (payment.status === STATUS.PAID) {
    await markCouponRedeemed(payment.coupon_id);
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

  if (subscriptionPlanId && subscriptionId && item_type === "book") {
    try {
      const normalizedItemId =
        item_id === undefined || item_id === null ? item_id : String(item_id);
      const usage = await db("plan_usage_metrics")
        .where({
          plan_id: subscriptionPlanId,
          subscription_id: subscriptionId,
          item_type: "book",
          item_id: normalizedItemId,
        })
        .first();
      if (usage) {
        await db("plan_usage_metrics")
          .where({
            plan_id: subscriptionPlanId,
            subscription_id: subscriptionId,
            item_type: "book",
            item_id: normalizedItemId,
          })
          .update({ usage_count: usage.usage_count + 1 });
      } else {
        await db("plan_usage_metrics").insert({
          plan_id: subscriptionPlanId,
          subscription_id: subscriptionId,
          item_type: "book",
          item_id: normalizedItemId,
          usage_count: 1,
        });
      }
      await creditInstructorSubscription(
        "book",
        normalizedItemId,
        subscriptionPlanId,
        subscriptionId
      );
    } catch (err) {
      logger.error("Failed to record subscription usage:", err);
    }
  } else if (subscriptionPlanId && item_type === "book") {
    try {
      await creditInstructorSubscription("book", item_id, subscriptionPlanId);
    } catch (err) {
      logger.error("Failed to credit instructor for subscription book:", err);
    }
  }

  if (payment.status === STATUS.PAID) {
        await creditInstructorWallet(item_type, item_id, instructor_amount);
        await handleEnrollment(item_type, user_id, item_id);
        await clearCartItem(user_id, item_id, item_type);
        await markCouponRedeemed(payment.coupon_id);
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
      if (user?.email && !user?.invoice_email_opt_out && invoice) {
        const attachmentPath = resolveInvoicePath(invoice);
        const payload = {
          to: user.email,
          subject: "Payment Invoice",
          html: `<p>Please find your invoice attached.</p>`,
        };
        if (attachmentPath) {
          const attachment = { path: attachmentPath };
          if (invoice?.id) {
            attachment.filename = `invoice-${invoice.id}.pdf`;
          }
          payload.attachments = [attachment];
        }
        await mailService.sendMail(payload);
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
  const payment = await service.getById(req.params.id, req.tenant?.id);
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
  const updated = await service.update(
    req.params.id,
    updateData,
    req.tenant?.id,
  );
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

exports.getPayments = catchAsync(async (req, res) => {
  const data = await service.getAll(undefined, undefined, req.tenant?.id);
  sendSuccess(res, data);
});

exports.getMyPayments = catchAsync(async (req, res) => {
  const { status, itemType, limit, offset, sortDirection } = req.query || {};

  const filters = {};
  if (status !== undefined && status !== null && status !== "") {
    filters.status = status;
  }
  if (itemType !== undefined && itemType !== null && itemType !== "") {
    filters.itemType = itemType;
  }
  if (limit !== undefined && limit !== null && limit !== "") {
    filters.limit = limit;
  }
  if (offset !== undefined && offset !== null && offset !== "") {
    filters.offset = offset;
  }
  if (sortDirection !== undefined && sortDirection !== null && sortDirection !== "") {
    filters.sortDirection = sortDirection;
  }

  const hasFilters = Object.keys(filters).length > 0;
  const tenantId = req.tenant?.id;
  const data = hasFilters
    ? await service.getByUser(req.user.id, filters, tenantId)
    : await service.getByUser(req.user.id, {}, tenantId);
  sendSuccess(res, data);
});

exports.getMyPayment = catchAsync(async (req, res) => {
  const payment = await service.getById(req.params.id, req.tenant?.id);
  if (!payment || payment.user_id !== req.user.id)
    throw new AppError("Payment not found", 404);
  sendSuccess(res, payment);
});

exports.getPayment = catchAsync(async (req, res) => {
  const payment = await service.getById(req.params.id, req.tenant?.id);
  if (!payment) throw new AppError("Payment not found", 404);
  sendSuccess(res, payment);
});

exports.updatePayment = catchAsync(async (req, res) => {
  const tenantId = req.tenant?.id;
  const existing = await service.getById(req.params.id, tenantId);
  const payment = await service.update(req.params.id, req.body, tenantId);
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
          await clearCartItem(payment.user_id, payment.item_id, payment.item_type);
        } catch (err) {
          logger.error("Failed to grant access after admin approval:", err);
        }

        if (
          payment.item_type === "class" &&
          Number(payment.installments || 1) > 1 &&
          Number(payment.installment_number || 1) > 1
        ) {
          try {
            if (typeof service.findInstallmentContext === "function") {
              const context = await service.findInstallmentContext(
                payment.user_id,
                payment.item_type,
                payment.item_id,
                tenantId,
              );
              const schedule = context?.schedule;
              if (schedule) {
                await paymentScheduleService.markPaid(schedule.id);
                if (schedule.payment_id) {
                  await db("payments")
                    .where({ id: schedule.payment_id })
                    .update({ next_due_date: null, updated_at: new Date() });
                }
              }
            }
          } catch (err) {
            logger.error(
              "Failed to settle installment schedule after approval:",
              err
            );
          }
        }

        message = `Your payment ${payment.id} has been approved.`;
        subject = "Payment Approved";
        try {
          const invoice = await invoiceService.generateFromPayment(payment, user);
          if (user?.email && !user?.invoice_email_opt_out && invoice) {
            const attachmentPath = resolveInvoicePath(invoice);
            const payload = {
              to: user.email,
              subject: "Payment Invoice",
              html: `<p>Please find your invoice attached.</p>`,
            };
            if (attachmentPath) {
              const attachment = { path: attachmentPath };
              if (invoice?.id) {
                attachment.filename = `invoice-${invoice.id}.pdf`;
              }
              payload.attachments = [attachment];
            }
            await mailService.sendMail(payload);
          }
        } catch (err) {
          logger.error("Failed to generate invoice:", err);
        }
        await creditInstructorFromPayment(payment);
        await markCouponRedeemed(payment.coupon_id);
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
  await service.delete(req.params.id, req.tenant?.id);
  sendSuccess(res, null, "Payment deleted");
});
