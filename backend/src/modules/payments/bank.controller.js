const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const paymentsService = require("./payments.service");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");
const paymentMethodsService = require("../paymentMethods/paymentMethods.service");
const notificationService = require("../notifications/notifications.service");
const mailService = require("../../services/mailService");
const userModel = require("../users/user.model");
const { grantAccess } = require("./paymentAccess");
const { v4: uuidv4 } = require("uuid");

const DEFAULT_PLATFORM_CUT = {
  class: 15,
  book: 10,
  tutorial: 20,
};

const ALLOWED_ITEM_TYPES = ["class", "book", "tutorial"];
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

  const paymentData = {
    id: uuidv4(),
    user_id,
    method_id: bankMethod.id,
    item_type,
    item_id,
    amount: numericAmount,
    currency: currencyCode,
    status: "awaiting_approval",
    platform_fee,
    instructor_amount,
    bank_details,
  };

  const payment = await paymentsService.create(paymentData);

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

  try {
    const user = await userModel.findById(payment.user_id);
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

  sendSuccess(res, payment, "Bank payment approved");
});

exports.rejectBankPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.rejectBankPayment(
    req.params.id,
    req.body
  );
  sendSuccess(res, payment, "Bank payment rejected");
});

