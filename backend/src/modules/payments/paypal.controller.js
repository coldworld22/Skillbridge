const logger = require('../../utils/logger.js');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');
const paymentsService = require('./payments.service');
const { STATUS } = paymentsService;
const paymentConfigService = require('../paymentConfig/paymentConfig.service');
const paymentMethodsService = require('../paymentMethods/paymentMethods.service');
const paypalService = require('../../services/paypalService');
const { grantAccess } = require('./paymentAccess');
const { v4: uuidv4 } = require('uuid');
const plansService = require('../plans/plans.service');
const { creditInstructorFromPayment } = require('./helpers/wallet');

const DEFAULT_PLATFORM_CUT = {
  class: 15,
  book: 10,
  tutorial: 20,
};

const ALLOWED_ITEM_TYPES = ['class', 'book', 'tutorial', 'plan'];
const SUPPORTED_CURRENCIES = [
  'USD','EUR','GBP','JPY','CNY','SAR','AED','KWD','INR','CAD','AUD','CHF','QAR','EGP','TRY','KRW','SGD','RUB',
];

exports.createPayPalPayment = catchAsync(async (req, res) => {
  const { item_type, item_id, amount, currency } = req.body;
  const user_id = req.user?.id;
  if (!user_id || !item_type || !item_id || amount === undefined) {
    throw new AppError('Missing required fields', 400);
  }
  if (!ALLOWED_ITEM_TYPES.includes(item_type)) {
    throw new AppError('Invalid item type', 400);
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError('Amount must be a positive number', 400);
  }
  const currencyCode = currency || 'USD';
  if (!SUPPORTED_CURRENCIES.includes(currencyCode)) {
    throw new AppError('Unsupported currency', 400);
  }

  // For plan subscriptions, ensure the payment amount matches one of the
  // published plan prices. This mirrors the validation applied to other
  // purchasable items like classes or books.
  if (item_type === 'plan') {
    const plan = await plansService.getPlanById(item_id);
    if (!plan) throw new AppError('Plan not found', 404);
    const prices = [Number(plan.price_monthly), Number(plan.price_yearly)];
    const matched = prices.find((p) => Math.abs(numericAmount - p) < 0.01);
    if (!matched) {
      throw new AppError('Payment amount does not match plan price', 400);
    }
  }

  const method = await paymentMethodsService.getByType('paypal');
  if (!method) {
    throw new AppError('PayPal payment method not configured', 400);
  }

  let platform_fee = 0;
  let instructor_amount = numericAmount;
  try {
    const cfg = await paymentConfigService.getSettings();
    const cut = cfg?.platformCut?.[item_type] ?? DEFAULT_PLATFORM_CUT[item_type] ?? 0;
    platform_fee = (numericAmount * cut) / 100;
    instructor_amount = numericAmount - platform_fee;
  } catch (err) {
    logger.error('Failed to load payment settings:', err);
  }

  const paymentId = uuidv4();

  const order = await paypalService.createOrder({
    amount: numericAmount,
    currency: currencyCode,
    returnUrl: `${process.env.BACKEND_URL || ''}/api/payments/paypal/callback?payment_id=${paymentId}`,
    cancelUrl: process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/payments/error`
      : undefined,
  });
  const approval = order.links?.find((l) => l.rel === 'approve')?.href;
  if (!approval) {
    throw new AppError('Unable to retrieve PayPal approval url', 500);
  }

  const paymentData = {
    id: paymentId,
    user_id,
    method_id: method.id,
    item_type,
    item_id,
    amount: numericAmount,
    currency: currencyCode,
    status: STATUS.PENDING_PAYMENT,
    reference_id: order.id,
    platform_fee,
    instructor_amount,
  };
  const payment = await paymentsService.create(paymentData);
  sendSuccess(res, { approval_url: approval, payment }, 'PayPal payment initiated');
});

exports.handlePayPalCallback = catchAsync(async (req, res) => {
  const { token: orderId, payment_id: paymentId } = req.query;
  if (!orderId || !paymentId) {
    throw new AppError('Missing order information', 400);
  }
  const payment = await paymentsService.getById(paymentId);
  if (!payment || payment.reference_id !== orderId) {
    throw new AppError('Payment not found', 404);
  }
  const capture = await paypalService.captureOrder(orderId);
  const info = capture.purchase_units?.[0]?.payments?.captures?.[0];
  let statusUpdate = { reference_id: info?.id || orderId };
  if (capture.status === 'COMPLETED') {
    statusUpdate.status = STATUS.PAID;
    statusUpdate.paid_at = new Date();
  } else {
    statusUpdate.status = STATUS.REJECTED;
  }
  const updated = await paymentsService.update(paymentId, statusUpdate);

  if (updated.status === STATUS.PAID) {
    await grantAccess(updated);
    const refreshed = await paymentsService.getById(updated.id);
    if (refreshed?.status === STATUS.PAID) {
      await creditInstructorFromPayment(refreshed);
    }
  }

  if (process.env.FRONTEND_URL) {
    const redirectUrl = `${process.env.FRONTEND_URL}/payments/${updated.status === STATUS.PAID ? 'success' : 'error'}`;
    return res.redirect(redirectUrl);
  }
  sendSuccess(res, updated, 'PayPal payment processed');
});
