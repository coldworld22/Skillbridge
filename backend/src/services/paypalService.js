const { Client, Environment, OrdersController, CheckoutPaymentIntent } = require('@paypal/paypal-server-sdk');
const paymentMethodsService = require('../modules/paymentMethods/paymentMethods.service');

let client;

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

exports.invalidateClient = () => {
  client = null;
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
  const cli = await getClient();
  const orders = new OrdersController(cli);
  const { result } = await orders.createOrder({
    body,
    prefer: 'return=representation',
  });
  return result;
};

exports.captureOrder = async (orderId) => {
  const cli = await getClient();
  const orders = new OrdersController(cli);
  const { result } = await orders.captureOrder({ id: orderId, body: {} });
  return result;
};
