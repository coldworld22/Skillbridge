const logger = require('../../utils/logger.js');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');
const paymentsService = require('./payments.service');
const { STATUS } = paymentsService;
const paymentConfigService = require('../paymentConfig/paymentConfig.service');
const paymentMethodsService = require('../paymentMethods/paymentMethods.service');
const coinbaseService = require('../../services/coinbaseService');
const { v4: uuidv4 } = require('uuid');
const { grantAccess } = require('./paymentAccess');
const { creditInstructorFromPayment } = require('./helpers/wallet');
const { loadAndValidateCoupon } = require('./helpers/coupon');
const { ensurePlanAmountMatches } = require('./helpers/planPricing');

const DEFAULT_PLATFORM_CUT = {
  class: 15,
  book: 10,
  tutorial: 20,
};

const ALLOWED_ITEM_TYPES = ['class', 'book', 'tutorial', 'plan'];
const SUPPORTED_FIAT = [
  'USD','EUR','GBP','JPY','CNY','SAR','AED','KWD','INR','CAD','AUD','CHF','QAR','EGP','TRY','KRW','SGD','RUB',
];

exports.initiateCoinbasePayment = catchAsync(async (req, res) => {
  const { item_type, item_id, amount, currency, coupon_id } = req.body;
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
  if (!SUPPORTED_FIAT.includes(currencyCode)) {
    throw new AppError('Unsupported currency', 400);
  }
  const coupon = await loadAndValidateCoupon(coupon_id, {
    itemType: item_type,
    itemId: item_id,
  });

  if (item_type === 'plan') {
    await ensurePlanAmountMatches(item_id, numericAmount, { coupon });
  }

  const method = await paymentMethodsService.getByType('coinbase');
  if (!method) {
    throw new AppError('Coinbase payment method not configured', 400);
  }
  const settings = method.settings || {};
  if (!settings.api_key) {
    throw new AppError('Coinbase payment method missing API key', 500);
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

  const params = {
    name: 'Course Purchase',
    description: 'Access to Prime Content',
    pricing_type: 'fixed_price',
    local_price: { amount: numericAmount, currency: currencyCode },
    metadata: { payment_id: paymentId },
  };
  if (process.env.FRONTEND_URL) {
    params.redirect_url = `${process.env.FRONTEND_URL}/payments/success`;
    params.cancel_url = `${process.env.FRONTEND_URL}/payments/error`;
  }

  const charge = await coinbaseService.createCharge(settings.api_key, params);

  const chargeData = charge?.data || charge;

  const paymentData = {
    id: paymentId,
    user_id,
    method_id: method.id,
    item_type,
    item_id,
    amount: numericAmount,
    currency: currencyCode,
    status: STATUS.PENDING_PAYMENT,
    reference_id: chargeData.id?.toString() || null,
    receipt_url: chargeData.hosted_url,
    platform_fee,
    instructor_amount,
  };
  const payment = await paymentsService.create(paymentData);

  sendSuccess(res, { hosted_url: chargeData.hosted_url, payment }, 'Coinbase payment initiated');
});

exports.handleWebhook = catchAsync(async (req, res) => {
  const signature = req.get('X-CC-Webhook-Signature');
  const payload = JSON.stringify(req.body || {});
  const event = req.body?.event;
  const paymentId = event?.data?.metadata?.payment_id;
  if (!paymentId) return res.status(400).end();

  const payment = await paymentsService.getById(paymentId);
  if (!payment) return res.status(404).end();
  const method = await paymentMethodsService.getById(payment.method_id);
  const secret = method?.settings?.webhook_secret;
  if (!coinbaseService.verifyWebhook(payload, signature, secret)) {
    return res.status(400).end();
  }

  let statusUpdate = {};
  const type = event?.type;
  const chargeId = event?.data?.id;
  if (type === 'charge:confirmed') {
    statusUpdate = { status: STATUS.PAID, reference_id: chargeId, paid_at: new Date() };
  } else if (type === 'charge:failed') {
    statusUpdate = { status: STATUS.REJECTED, reference_id: chargeId };
  }
  if (Object.keys(statusUpdate).length) {
    const updated = await paymentsService.update(paymentId, statusUpdate);
    if (updated.status === STATUS.PAID) {
      await grantAccess(updated);
      const refreshed = await paymentsService.getById(updated.id);
      if (refreshed?.status === STATUS.PAID) {
        await creditInstructorFromPayment(refreshed);
      }
    }
  }
  res.json({ ok: true });
});
