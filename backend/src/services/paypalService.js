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
    throw new Error('PayPal credentials are not configured');
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

function mapPayPalSdkError(err, context) {
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

exports.createOrder = async ({ amount, currency = 'USD', returnUrl, cancelUrl }) => {
  const body = {
    intent: CheckoutPaymentIntent.Capture,
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: String(amount),
        },
      },
    ],
  };
  if (returnUrl || cancelUrl) {
    body.application_context = {};
    if (returnUrl) body.application_context.return_url = returnUrl;
    if (cancelUrl) body.application_context.cancel_url = cancelUrl;
  }
  try {
    const orders = await getOrdersController();
    const { result } = await orders.createOrder({
      body,
      prefer: 'return=representation',
    });
    return result;
  } catch (err) {
    throw mapPayPalSdkError(err, 'creating an order');
  }
};

exports.captureOrder = async (orderId) => {
  try {
    const orders = await getOrdersController();
    const { result } = await orders.captureOrder({ id: orderId, body: {} });
    return result;
  } catch (err) {
    throw mapPayPalSdkError(err, 'capturing an order');
  }
};
