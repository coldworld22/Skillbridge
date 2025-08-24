const paypal = require('@paypal/checkout-server-sdk');
const paymentMethodsService = require('../modules/paymentMethods/paymentMethods.service');

let client;

async function getClient() {
  if (client) return client;
  const settings = await paymentMethodsService.getPayPalSettings();
  if (!settings?.client_id || !settings?.client_secret) {
    throw new Error('PayPal credentials are not configured');
  }
  const mode = settings.mode === 'live' ? 'live' : 'sandbox';
  const environment =
    mode === 'live'
      ? new paypal.core.LiveEnvironment(
          settings.client_id,
          settings.client_secret
        )
      : new paypal.core.SandboxEnvironment(
          settings.client_id,
          settings.client_secret
        );
  client = new paypal.core.PayPalHttpClient(environment);
  return client;
}

exports.invalidateClient = () => {
  client = null;
};

exports.createOrder = async ({ amount, currency = 'USD', returnUrl, cancelUrl }) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount,
        },
      },
    ],
  };
  if (returnUrl || cancelUrl) {
    body.application_context = {};
    if (returnUrl) body.application_context.return_url = returnUrl;
    if (cancelUrl) body.application_context.cancel_url = cancelUrl;
  }
  request.requestBody(body);
  const cli = await getClient();
  const response = await cli.execute(request);
  return response.result;
};

exports.captureOrder = async (orderId) => {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  const cli = await getClient();
  const response = await cli.execute(request);
  return response.result;
};
