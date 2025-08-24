const crypto = require('crypto');

// Use native fetch if available, otherwise fall back to node-fetch via dynamic import.
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE_URL = 'https://api.nowpayments.io/v1';

/**
 * Create a NowPayments invoice.
 * @param {string} apiKey - NowPayments API key.
 * @param {object} params - Invoice parameters.
 * @returns {Promise<object>} Invoice response.
 */
exports.createInvoice = async (apiKey, params) => {
  const res = await fetchFn(`${BASE_URL}/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NowPayments createInvoice failed: ${text}`);
  }
  return res.json();
};

/**
 * Verify NowPayments IPN signature using HMAC SHA512.
 * @param {object} payload - Parsed JSON body received from NowPayments.
 * @param {string} signature - Value from the 'x-nowpayments-sig' header.
 * @param {string} secret - IPN secret from payment method settings.
 * @returns {boolean} True if signature matches, else false.
 */
exports.verifyIpnSignature = (payload, signature, secret) => {
  if (!signature || !secret) return false;
  try {
    const hmac = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return hmac === signature;
  } catch (_) {
    return false;
  }
};

