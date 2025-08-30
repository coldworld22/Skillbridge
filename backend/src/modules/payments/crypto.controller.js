const logger = require('../../utils/logger.js');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');
const paymentsService = require('./payments.service');
const { STATUS } = paymentsService;
const paymentConfigService = require('../paymentConfig/paymentConfig.service');
const paymentMethodsService = require('../paymentMethods/paymentMethods.service');
const nowPayments = require('../../services/nowPaymentsService');
const { v4: uuidv4 } = require('uuid');
const libraryService = require('../library/library.service');
const enrollmentService = require('../classes/enrollments/classEnrollment.service');
const tutorialEnrollmentService = require('../users/tutorials/enrollments/tutorialEnrollment.service');
const { getCommissionRate } = require('./commission.helper');

const DEFAULT_PLATFORM_CUT = {
  class: 15,
  book: 10,
  tutorial: 20,
};

const ALLOWED_ITEM_TYPES = ['class', 'book', 'tutorial'];

const SUPPORTED_FIAT = [
  'USD','EUR','GBP','JPY','CNY','SAR','AED','KWD','INR','CAD','AUD','CHF','QAR','EGP','TRY','KRW','SGD','RUB',
];

exports.initiateCryptoPayment = catchAsync(async (req, res) => {
  const { item_type, item_id, amount, currency, method_type } = req.body;
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

  const method = await paymentMethodsService.getByType(method_type || 'crypto');
  if (!method) {
    throw new AppError('Crypto payment method not configured', 400);
  }
  const settings = method.settings || {};
  if (!settings.api_key) {
    throw new AppError('Crypto payment method missing API key', 500);
  }

  const paymentId = uuidv4();

  let platform_fee = 0;
  let instructor_amount = numericAmount;
  try {
    let cut = await getCommissionRate(item_type, item_id);
    if (cut === null || cut === undefined) {
      const cfg = await paymentConfigService.getSettings();
      cut = cfg?.platformCut?.[item_type] ?? DEFAULT_PLATFORM_CUT[item_type] ?? 0;
    }
    platform_fee = (numericAmount * cut) / 100;
    instructor_amount = numericAmount - platform_fee;
  } catch (err) {
    logger.error('Failed to load payment settings:', err);
  }

  const params = {
    price_amount: numericAmount,
    price_currency: currencyCode,
    pay_currency: settings.currency || 'USDT',
    order_id: paymentId,
  };
  if (settings.ipn_secret) {
    params.ipn_callback_url = `${process.env.BACKEND_URL || ''}/api/payments/crypto/ipn`;
  }
  if (process.env.FRONTEND_URL) {
    params.success_url = `${process.env.FRONTEND_URL}/payments/success`;
    params.cancel_url = `${process.env.FRONTEND_URL}/payments/error`;
  }

  const invoice = await nowPayments.createInvoice(settings.api_key, params);

  const paymentData = {
    id: paymentId,
    user_id,
    method_id: method.id,
    item_type,
    item_id,
    amount: numericAmount,
    currency: currencyCode,
    status: STATUS.PENDING_PAYMENT,
    reference_id: invoice.id?.toString() || null,
    receipt_url: invoice.invoice_url,
    platform_fee,
    instructor_amount,
  };
  const payment = await paymentsService.create(paymentData);

  sendSuccess(res, { invoice_url: invoice.invoice_url, payment }, 'Crypto payment initiated');
});

exports.handleIPN = catchAsync(async (req, res) => {
  const signature = req.get('x-nowpayments-sig');
  const payload = req.body || {};
  const paymentId = payload.order_id;
  if (!paymentId) return res.status(400).end();

  const payment = await paymentsService.getById(paymentId);
  if (!payment) return res.status(404).end();
  const method = await paymentMethodsService.getById(payment.method_id);
  const secret = method?.settings?.ipn_secret;
  if (!nowPayments.verifyIpnSignature(payload, signature, secret)) {
    return res.status(400).end();
  }

  let statusUpdate = {};
  const status = payload.payment_status;
  if (status === 'finished') {
    statusUpdate = { status: STATUS.PAID, reference_id: payload.payment_id, paid_at: new Date() };
  } else if (status === 'failed') {
    statusUpdate = { status: STATUS.REJECTED, reference_id: payload.payment_id };
  }
  if (Object.keys(statusUpdate).length) {
    const updated = await paymentsService.update(paymentId, statusUpdate);
    if (updated.status === 'paid') {
      try {
        if (updated.item_type === 'book') {
          await libraryService.recordPurchase(
            updated.user_id,
            updated.item_id,
            updated.amount
          );
        } else if (updated.item_type === 'class') {
          await enrollmentService.createEnrollment({
            id: uuidv4(),
            user_id: updated.user_id,
            class_id: updated.item_id,
            status: 'enrolled',
          });
        } else if (updated.item_type === 'tutorial') {
          await tutorialEnrollmentService.createEnrollment({
            id: uuidv4(),
            user_id: updated.user_id,
            tutorial_id: updated.item_id,
            status: 'enrolled',
          });
        }
      } catch (err) {
        logger.error('Failed to finalize enrollment after Crypto payment:', err);
      }
    }
  }
  res.json({ ok: true });
});

