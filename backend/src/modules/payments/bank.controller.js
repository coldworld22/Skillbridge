const path = require("path");
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
const classService = require("../classes/class.service");
const { grantAccess } = require("./paymentAccess");
const { v4: uuidv4 } = require("uuid");
const couponService = require("../coupons/coupons.service");
const bookService = require("../books/book.service");
const tutorialService = require("../users/tutorials/tutorial.service");
const invoiceService = require("../invoices/invoices.service");
const { creditInstructorFromPayment } = require("./helpers/wallet");
const { loadAndValidateCoupon, markCouponRedeemed } = require("./helpers/coupon");
const { enforceBaseCurrency } = require("./helpers/currency");
const { ensurePlanAmountMatches } = require("./helpers/planPricing");

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

const parseSettingsObject = (rawSettings) => {
  if (!rawSettings) return {};
  if (typeof rawSettings === "object") return rawSettings;
  if (typeof rawSettings === "string") {
    try {
      const parsed = JSON.parse(rawSettings);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_err) {
      return {};
    }
  }
  return {};
};

const normalizeBankSettings = (rawSettings = {}) => {
  const settings = parseSettingsObject(rawSettings);
  const bankSource =
    settings.bank_details || settings.bankDetails || settings.bank || {};

  const pickValue = (...keys) => {
    for (const key of keys) {
      if (bankSource[key] !== undefined && bankSource[key] !== null) {
        return bankSource[key];
      }
      if (settings[key] !== undefined && settings[key] !== null) {
        return settings[key];
      }
    }
    return null;
  };

  const trimValue = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }
    return value;
  };

  const instructions =
    trimValue(
      bankSource.instructions ||
        settings.instructions ||
        settings.note ||
        settings.details ||
        null
    ) || null;

  return {
    bank_name: trimValue(pickValue("bank_name", "bankName")),
    account_holder_name: trimValue(
      pickValue("account_holder_name", "accountHolderName", "account_name")
    ),
    account_number: trimValue(
      pickValue("account_number", "accountNumber", "account_no", "accountNo")
    ),
    iban: trimValue(
      pickValue("iban", "IBAN", "account_iban", "international_account_number")
    ),
    swift_code: trimValue(pickValue("swift_code", "swiftCode", "bic")),
    branch_address: trimValue(pickValue("branch_address", "branchAddress")),
    instructions,
  };
};

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
    iban,
    swift_code,
    branch_address,
    extra_instructions,
    coupon_id,
    reference,
    reference_id,
  } = req.body;
  const user_id = req.user?.id;

  const receiptUrl = req.file
    ? `/uploads/payment-receipts/${req.file.filename}`
    : undefined;

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

  const currencyCode = enforceBaseCurrency(currency);
  if (!SUPPORTED_CURRENCIES.includes(currencyCode)) {
    throw new AppError("Unsupported currency", 400);
  }

  const bankMethod = await paymentMethodsService.getByType("bank");
  if (!bankMethod) {
    throw new AppError("Bank payment method not configured", 400);
  }

  const coupon = await loadAndValidateCoupon(coupon_id, {
    itemType: item_type,
    itemId: item_id,
  });

  // Verify amount matches catalog price
  let basePrice;
  let discountApplied = false;
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
    const match = await ensurePlanAmountMatches(item_id, numericAmount, {
      coupon,
    });
    basePrice = match.normalizedAmount;
    discountApplied = true;
  }
  if (coupon && !discountApplied) {
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

  const configuredBankDetails = normalizeBankSettings(bankMethod.settings);
  const normalizeInput = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }
    return value;
  };

  const resolvedInstructions =
    normalizeInput(extra_instructions) || configuredBankDetails.instructions;

  const bank_details = {
    bank_name: normalizeInput(bank_name) || configuredBankDetails.bank_name,
    account_holder_name:
      normalizeInput(account_holder_name) || configuredBankDetails.account_holder_name,
    account_number:
      normalizeInput(account_number) || configuredBankDetails.account_number,
    iban: normalizeInput(iban) || configuredBankDetails.iban,
    swift_code: normalizeInput(swift_code) || configuredBankDetails.swift_code,
    branch_address:
      normalizeInput(branch_address) || configuredBankDetails.branch_address,
    instructions: resolvedInstructions,
    extra_instructions: resolvedInstructions,
  };

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
    coupon_id: coupon?.id || null,
  };

  const ref = reference || reference_id;
  if (ref) paymentData.reference_id = ref;
  if (receiptUrl) paymentData.receipt_url = receiptUrl;

  const payment = await paymentsService.create(paymentData);

  let user;
  try {
    const method = await paymentMethodsService.getByType("bank");
    const bank = normalizeBankSettings(method?.settings);
    user = await userModel.findById(user_id);
    if (user?.email) {
      const html = `
        <p>Dear ${user.full_name || ""},</p>
        <p>Please complete your payment via bank transfer using the details below:</p>
        <ul>
          <li><strong>Bank:</strong> ${bank.bank_name || ""}</li>
          <li><strong>Account Number:</strong> ${bank.account_number || ""}</li>
          <li><strong>IBAN:</strong> ${bank.iban || ""}</li>
          <li><strong>SWIFT:</strong> ${bank.swift_code || ""}</li>
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
  let refreshedPayment = payment;
  try {
    const latest = await paymentsService.getById(payment.id);
    if (latest) refreshedPayment = latest;
  } catch (err) {
    logger.warn("Failed to refresh bank payment after approval:", err);
  }
  if (refreshedPayment?.status === STATUS.PAID) {
    await creditInstructorFromPayment(refreshedPayment);
    await markCouponRedeemed(refreshedPayment?.coupon_id);
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
      if (user.email && !user.invoice_email_opt_out && invoice) {
        const attachmentPath =
          invoice.file_path || invoice.pdf_url || null;
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
