const { Client, Environment, OrdersController, CheckoutPaymentIntent } = require('@paypal/paypal-server-sdk');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger.js');
const paymentMethodsService = require('../modules/paymentMethods/paymentMethods.service');

let client;
let ordersController;

function resetClient() {
  client = null;
  ordersController = null;
}

async function getClient() {
  if (client) return client;
  const settings = await paymentMethodsService.getPayPalSettings();
  if (!settings?.client_id || !settings?.client_secret) {
    throw new AppError(
      'PayPal payments are temporarily unavailable. Please contact support.',
      503
    );
  }
  const environment =
    settings.mode === 'live' ? Environment.Production : Environment.Sandbox;
  client = new Client({
    environment,
    clientCredentialsAuthCredentials: {
      oAuthClientId: settings.client_id,
      oAuthClientSecret: settings.client_secret,
    },
  });
  return client;
}

async function getOrdersController() {
  if (ordersController) return ordersController;
  const cli = await getClient();
  ordersController = new OrdersController(cli);
  return ordersController;
}

const TRANSIENT_PAYPAL_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
]);

const PAYPAL_RETRY_DELAYS_MS = [150, 350];

function parseStatusCode(err) {
  if (!err) return null;
  const status = err.statusCode ?? err.status ?? err?.result?.statusCode;
  if (typeof status === 'number' && Number.isFinite(status)) {
    return status;
  }
  if (typeof status === 'string') {
    const parsed = Number.parseInt(status, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if (err.cause && err.cause !== err) {
    return parseStatusCode(err.cause);
  }
  return null;
}

function extractErrorCode(err) {
  if (!err) return null;
  if (typeof err.code === 'string') return err.code;
  if (err.cause && err.cause !== err) {
    return extractErrorCode(err.cause);
  }
  return null;
}

function isTransientPayPalError(err) {
  if (!err || err instanceof AppError) {
    return false;
  }
  const status = parseStatusCode(err);
  if (status !== null) {
    if (status === 408 || status === 429) {
      return true;
    }
    if (status >= 500 && status !== 501) {
      return true;
    }
  }
  const code = extractErrorCode(err);
  if (code && TRANSIENT_PAYPAL_ERROR_CODES.has(code)) {
    return true;
  }
  const name = err.name;
  if (name === 'AbortError' || name === 'TimeoutError') {
    return true;
  }
  if (err.cause && err.cause !== err) {
    return isTransientPayPalError(err.cause);
  }
  return false;
}

function describeError(err) {
  const status = parseStatusCode(err);
  if (status !== null) {
    return `status ${status}`;
  }
  const code = extractErrorCode(err);
  if (code) {
    return `code ${code}`;
  }
  if (err?.message) {
    return err.message;
  }
  return '';
}

async function executeWithRetries(context, operation) {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      const shouldRetry =
        attempt < PAYPAL_RETRY_DELAYS_MS.length && isTransientPayPalError(err);
      if (!shouldRetry) {
        throw err;
      }
      const delay = PAYPAL_RETRY_DELAYS_MS[attempt];
      attempt += 1;
      const details = describeError(err);
      logger.warn(
        `Transient PayPal error while ${context}${
          details ? ` (${details})` : ''
        }. Retrying in ${delay}ms...`
      );
      resetClient();
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function mapPayPalSdkError(err, context) {
  if (err instanceof AppError) {
    return err;
  }

  resetClient();
  const status = err?.statusCode;
  const details =
    err?.result?.message ||
    err?.result?.details?.[0]?.issue ||
    err?.message ||
    'Unknown PayPal error';

  logger.error(
    `PayPal SDK error while ${context}: ${details}`,
    status ? `(status ${status})` : '',
    err?.stack || ''
  );

  if (status === 401 || status === 403) {
    return new AppError(
      'PayPal payments are temporarily unavailable. Please contact support.',
      502
    );
  }

  if (status && status >= 400 && status < 500) {
    return new AppError(
      'PayPal rejected the request. Please try again or use a different payment method.',
      400
    );
  }

  return new AppError(
    'Unable to reach PayPal right now. Please try again later.',
    502
  );
}

exports.invalidateClient = resetClient;

const CURRENCY_DECIMALS = {
  JPY: 0,
  KRW: 0,
  KWD: 3,
};

function normalizeAmount(amount, currency) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new AppError('Invalid PayPal amount specified', 400);
  }

  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const factor = 10 ** decimals;
  const rounded = Math.round((numeric + Number.EPSILON) * factor) / factor;

  return rounded.toFixed(decimals);
}

exports.createOrder = async ({ amount, currency = 'USD', returnUrl, cancelUrl }) => {
  const normalizedCurrency = currency.toUpperCase();
  const formattedAmount = normalizeAmount(amount, normalizedCurrency);

  const body = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        amount: {
          currencyCode: normalizedCurrency,
          value: formattedAmount,
        },
      },
    ],
  };
  if (returnUrl || cancelUrl) {
    body.applicationContext = {};
    if (returnUrl) body.applicationContext.returnUrl = returnUrl;
    if (cancelUrl) body.applicationContext.cancelUrl = cancelUrl;
  }
  try {
    const { result } = await executeWithRetries('creating an order', async () => {
      const orders = await getOrdersController();
      return orders.createOrder({
        body,
        prefer: 'return=representation',
      });
    });
    return result;
  } catch (err) {
    throw mapPayPalSdkError(err, 'creating an order');
  }
};

exports.captureOrder = async (orderId) => {
  try {
    const { result } = await executeWithRetries('capturing an order', async () => {
      const orders = await getOrdersController();
      return orders.captureOrder({ id: orderId, body: {} });
    });
    return result;
  } catch (err) {
    throw mapPayPalSdkError(err, 'capturing an order');
  }
};
