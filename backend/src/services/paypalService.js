const { Client, Environment, OrdersController, CheckoutPaymentIntent } = require('@paypal/paypal-server-sdk');
const paymentMethodsService = require('../modules/paymentMethods/paymentMethods.service');

let client;
let ordersController;

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

exports.invalidateClient = () => {
  client = null;
  ordersController = null;
};

exports.createOrder = async ({ amount, currency = 'USD', returnUrl, cancelUrl }) => {
  const body = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        amount: {
          currencyCode: currency,
          value: String(amount),
        },
      },
    ],
  };
  if (returnUrl || cancelUrl) {
    body.applicationContext = {};
    if (returnUrl) body.applicationContext.returnUrl = returnUrl;
    if (cancelUrl) body.applicationContext.cancelUrl = cancelUrl;
  }
  const orders = await getOrdersController();
  const { result } = await orders.createOrder({
    body,
    prefer: 'return=representation',
  });
  return result;
};

exports.captureOrder = async (orderId) => {
  const orders = await getOrdersController();
  const { result } = await orders.captureOrder({ id: orderId, body: {} });
  return result;
};
