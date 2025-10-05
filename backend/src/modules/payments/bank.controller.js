const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const paymentsService = require("./payments.service");
const { STATUS } = paymentsService;
const paymentConfigService = require("../paymentConfig/paymentConfig.service");
const paymentMethodsService = require("../paymentMethods/paymentMethods.service");
const notificationService = require("../notifications/notifications.service");
const mailService = require("../../services/mailService");
const userModel = require("../users/user.model");
const walletService = require("../payouts/wallet.service");
const classService = require("../classes/class.service");
const { grantAccess } = require("./paymentAccess");
const { v4: uuidv4 } = require("uuid");
const couponService = require("../coupons/coupons.service");
const bookService = require("../books/book.service");
const tutorialService = require("../users/tutorials/tutorial.service");
const plansService = require("../plans/plans.service");

const invoiceService = require("../invoices/invoices.service");
const { resolveInvoicePdfPath } = require("../invoices/helpers/invoicePath");

const resolveInvoiceAttachmentPath = (invoice) => {
  if (typeof invoiceService.resolveInvoiceAttachmentPath === "function") {
    const resolved = invoiceService.resolveInvoiceAttachmentPath(invoice);
    if (resolved) return resolved;
  }

  return resolveInvoicePdfPath(invoice);
};

const DEFAULT_PLATFORM_CUT = {
  class: 15,
  book: 10,
  tutorial: 20,
};

const ALLOWED_ITEM_TYPES = ["class", "book", "tutorial", "plan"];
const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "SAR",
  "AED",
  "KWD",
  "INR",
  "CAD",
  "AUD",
  "CHF",
  "QAR",
  "EGP",
  "TRY",
  "KRW",
  "SGD",
  "RUB",
];

exports.getBankPayments = catchAsync(async (req, res) => {
  const { status } = req.query;
  const data = await paymentsService.getAll(status, "bank");
  sendSuccess(res, data);
});

exports.initiateBankPayment = catchAsync(async (req, res) => {
  const {
    item_type,
    item_id,
    amount,
    currency,
    bank_name,
    account_holder_name,
    account_number,
    swift_code,
    branch_address,
    extra_instructions,
    coupon_id,
    reference,
    receipt_url,
  } = req.body;
  const user_id = req.user?.id;

  if (!user_id || !item_type || !item_id || amount === undefined) {
    throw new AppError("Missing required fields", 400);
  }

  if (!ALLOWED_ITEM_TYPES.includes(item_type)) {
    throw new AppError("Invalid item type", 400);
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError("Amount must be a positive number", 400);
  }

  const currencyCode = currency || "USD";
  if (!SUPPORTED_CURRENCIES.includes(currencyCode)) {
    throw new AppError("Unsupported currency", 400);
  }

  const bankMethod = await paymentMethodsService.getByType("bank");
  if (!bankMethod) {
    throw new AppError("Bank payment method not configured", 400);
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

  // Verify amount matches catalog price
  let basePrice;
  if (item_type === "class") {
    const cls = await classService.getClassById(item_id);
    if (!cls) throw new AppError("Class not found", 404);
    basePrice = Number(cls.price);
  } else if (item_type === "book") {
    const book = await bookService.getBookById(item_id);
    if (!book) throw new AppError("Book not found", 404);
    basePrice = Number(book.price);
  } else if (item_type === "tutorial") {
    const tut = await tutorialService.getTutorialById(item_id);
    if (!tut) throw new AppError("Tutorial not found", 404);
    basePrice = Number(tut.price);
  } else if (item_type === "plan") {
    // Plans can be purchased either monthly or yearly. Ensure the submitted
    // amount matches one of the plan's published prices before proceeding.
    const plan = await plansService.getPlanById(item_id);
    if (!plan) throw new AppError("Plan not found", 404);
    const prices = [Number(plan.price_monthly), Number(plan.price_yearly)];
    const matched = prices.find((p) => Math.abs(numericAmount - p) < 0.01);
    if (!matched) {
      throw new AppError("Payment amount does not match plan price", 400);
    }
    basePrice = matched;
  }
  if (coupon) {
    basePrice = +(basePrice * (1 - coupon.discount_percent / 100)).toFixed(2);
  }
  if (Math.abs(numericAmount - basePrice) >= 0.01) {
    throw new AppError("Payment amount does not match item price", 400);
  }

  let platform_fee = 0;
  let instructor_amount = numericAmount;
  try {
    const settings = await paymentConfigService.getSettings();
    const cut =
      settings?.platformCut?.[item_type] ??
      DEFAULT_PLATFORM_CUT[item_type] ??
      0;
    platform_fee = (numericAmount * cut) / 100;
    instructor_amount = numericAmount - platform_fee;
  } catch (err) {
    logger.error("Failed to load payment settings:", err);
  }

  const bank_details = {
    bank_name,
    account_holder_name,
    account_number,
    swift_code,
    branch_address,
    extra_instructions,
  };

  if (reference) {
    bank_details.reference = reference;
  }

  if (receipt_url) {
    bank_details.receipt_url = receipt_url;
  }

  const paymentData = {
    id: uuidv4(),
    user_id,
    method_id: bankMethod.id,
    item_type,
    item_id,
    amount: numericAmount,
    currency: currencyCode,
    status: STATUS.AWAITING_APPROVAL,
    platform_fee,
    instructor_amount,
    bank_details,
  };

  if (reference) {
    paymentData.reference_id = reference;
  }

  if (receipt_url) {
    paymentData.receipt_url = receipt_url;
  }

  const payment = await paymentsService.create(paymentData);

  let user;
  try {
    const method = await paymentMethodsService.getByType("bank");
    const bank = method?.settings || {};
    user = await userModel.findById(user_id);
    if (user?.email) {
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
        subject: "Bank Transfer Instructions",
        html,
      });
    }
  } catch (err) {
    logger.error("Failed to send bank transfer instructions:", err);
  }

  try {
    const admins = await userModel.findAdmins();
    const summary = `${user?.full_name || "A user"} submitted bank payment request ${payment.id} for ${numericAmount} ${currencyCode}.`;

    const notifResults = await Promise.allSettled(
      admins.map((admin) =>
        notificationService.createNotification({
          user_id: admin.id,
          type: "bank_payment_request",
          message: summary,
        })
      )
    );
    notifResults.forEach((r, idx) => {
      if (r.status === "rejected") {
        logger.error(
          "Failed to notify admin",
          admins[idx].id,
          r.reason?.message || r.reason
        );
      }
    });

    const emailAdmins = admins.filter((a) => a.email);
    const emailResults = await Promise.allSettled(
      emailAdmins.map((admin) =>
        mailService.sendMail({
          to: admin.email,
          subject: "New Bank Payment Request",
          html: `<p>${summary}</p>`,
        })
      )
    );
    emailResults.forEach((r, idx) => {
      if (r.status === "rejected") {
        logger.error(
          "Failed to email admin",
          emailAdmins[idx].id,
          r.reason?.message || r.reason
        );
      }
    });
  } catch (err) {
    logger.error("Failed to notify admins of bank payment request:", err);
  }

  sendSuccess(
    res,
    payment,
    "Bank transfer request submitted and pending admin approval"
  );
});

exports.approveBankPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.approveBankPayment(
    req.params.id,
    req.body
  );

  await grantAccess(payment);
  if (payment.item_type === "class") {
    try {
      const cls = await classService.getClassById(payment.item_id);
      if (cls?.instructor_id) {
        await walletService.increment(
          cls.instructor_id,
          payment.instructor_amount
        );
      }
    } catch (err) {
      logger.error("Failed to credit instructor wallet:", err);
    }
  } else if (payment.item_type === "book") {
    try {
      const book = await bookService.getBookById(payment.item_id);
      if (book?.instructor_id) {
        await walletService.increment(
          book.instructor_id,
          payment.instructor_amount
        );
      }
    } catch (err) {
      logger.error("Failed to credit instructor wallet:", err);
    }
  } else if (payment.item_type === "tutorial") {
    try {
      const tut = await tutorialService.getTutorialById(payment.item_id);
      if (tut?.instructor_id) {
        await walletService.increment(
          tut.instructor_id,
          payment.instructor_amount
        );
      }
    } catch (err) {
      logger.error("Failed to credit instructor wallet:", err);
    }
  }
  let user;
  try {
    user = await userModel.findById(payment.user_id);
    const message = `Your bank payment ${payment.id} has been approved.`;
    await notificationService.createNotification({
      user_id: payment.user_id,
      type: "payment_status",
      message,
    });
    if (user?.email) {
      await mailService.sendMail({
        to: user.email,
        subject: "Payment Approved",
        html: `<p>${message}</p>`,
      });
    }
  } catch (err) {
    logger.error("Failed to notify student of payment approval:", err);
  }

  try {
    if (user) {
      const invoice = await invoiceService.generateFromPayment(payment, user);
      if (user.email && !user.invoice_email_opt_out && invoice?.pdf_url) {
        const attachmentPath = resolveInvoiceAttachmentPath(invoice);
        if (attachmentPath) {
          await mailService.sendMail({
            to: user.email,
            subject: "Payment Invoice",
            html: `<p>Please find your invoice attached.</p>`,
            attachments: [{ path: attachmentPath }],
          });
        } else {
          logger.warn(
            "Invoice PDF URL was present but could not be resolved for attachment"
          );
        }
      }
    }
  } catch (err) {
    logger.error("Failed to generate invoice:", err);
  }

  sendSuccess(res, payment, "Bank payment approved");
});

exports.rejectBankPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.rejectBankPayment(
    req.params.id,
    req.body
  );
  sendSuccess(res, payment, "Bank payment rejected");
});

