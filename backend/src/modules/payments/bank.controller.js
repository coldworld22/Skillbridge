const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const paymentsService = require("./payments.service");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");
const paymentMethodsService = require("../paymentMethods/paymentMethods.service");
const { v4: uuidv4 } = require("uuid");

exports.initiateBankPayment = catchAsync(async (req, res) => {
  const { item_type, item_id, amount, currency } = req.body;
  const user_id = req.user?.id;

  if (!user_id || !item_type || !item_id || !amount) {
    throw new AppError("Missing required fields", 400);
  }

  const bankMethod = await paymentMethodsService.getByType("bank");
  if (!bankMethod) {
    throw new AppError("Bank payment method not configured", 400);
  }

  let platform_fee = 0;
  let instructor_amount = amount;
  try {
    const settings = await paymentConfigService.getSettings();
    const cut = settings?.platformCut?.[item_type] || 0;
    platform_fee = (amount * cut) / 100;
    instructor_amount = amount - platform_fee;
  } catch (err) {
    logger.error("Failed to load payment settings:", err);
  }

  const paymentData = {
    id: uuidv4(),
    user_id,
    method_id: bankMethod.id,
    item_type,
    item_id,
    amount,
    currency: currency || "USD",
    status: "pending_payment",
    platform_fee,
    instructor_amount,
  };

  const invoice = await paymentsService.create(paymentData);

  sendSuccess(res, { settings: bankMethod.settings, invoice }, "Bank payment initiated");
});

exports.approveBankPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.approveBankPayment(
    req.params.id,
    req.body
  );
  sendSuccess(res, payment, "Bank payment approved");
});

exports.rejectBankPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.rejectBankPayment(
    req.params.id,
    req.body
  );
  sendSuccess(res, payment, "Bank payment rejected");
});

