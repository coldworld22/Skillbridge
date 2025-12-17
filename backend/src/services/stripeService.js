const Stripe = require('stripe');
const paymentMethodsService = require('../modules/paymentMethods/paymentMethods.service');
const {
  normalizeCurrency,
  getMinorUnitsMultiplier,
} = require('../modules/payments/helpers/currency');

let stripeClient;

async function getClient() {
  if (stripeClient) return stripeClient;
  const method = await paymentMethodsService.getByType('stripe');
  const secret = method?.settings?.secret_key || process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('Stripe secret key not configured');
  }
  stripeClient = new Stripe(secret);
  return stripeClient;
}

exports.charge = async ({ token, amount, currency = 'USD' }) => {
  const client = await getClient();
  const normalizedCurrency = normalizeCurrency(currency);
  const multiplier = getMinorUnitsMultiplier(normalizedCurrency);
  return client.charges.create({
    amount: Math.round(Number(amount) * multiplier),
    currency: normalizedCurrency.toLowerCase(),
    source: token,
  });
};

exports.invalidate = () => {
  stripeClient = null;
};
