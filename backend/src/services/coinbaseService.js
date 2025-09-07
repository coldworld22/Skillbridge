const crypto = require('crypto');

// Use native fetch if available, otherwise fallback to node-fetch
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE_URL = 'https://api.commerce.coinbase.com';

/**
 * Create a Coinbase Commerce charge.
 * @param {string} apiKey - Coinbase Commerce API key.
 * @param {object} params - Charge parameters.
 * @returns {Promise<object>} Charge response.
 */
exports.createCharge = async (apiKey, params) => {
  const res = await fetchFn(`${BASE_URL}/charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': apiKey,
      'X-CC-Version': '2018-03-22',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coinbase createCharge failed: ${text}`);
  }
  return res.json();
};

/**
 * Verify Coinbase Commerce webhook signature.
 * @param {string} payload - Raw JSON string received.
 * @param {string} signature - Signature from 'X-CC-Webhook-Signature' header.
 * @param {string} secret - Shared webhook secret.
 * @returns {boolean} True if signature matches, otherwise false.
 */
exports.verifyWebhook = (payload, signature, secret) => {
  if (!signature || !secret) return false;
  try {
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return hmac === signature;
  } catch (_) {
    return false;
  }
};

