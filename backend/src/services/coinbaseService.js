const crypto = require('crypto');

// Use native fetch if available, otherwise fallback to node-fetch
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE_URL = 'https://api.commerce.coinbase.com';
const COINBASE_API_VERSION = '2018-03-22';
const CHARGE_DEPRECATED_REGEX = /charge creation has been deprecated/i;

const toJsonSafe = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_err) {
    return null;
  }
};

const coinbaseRequest = async (apiKey, path, body, label) => {
  const res = await fetchFn(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': apiKey,
      'X-CC-Version': COINBASE_API_VERSION,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const data = toJsonSafe(text);
  if (!res.ok) {
    const detail =
      data?.error?.message ||
      data?.message ||
      text ||
      res.statusText ||
      'Unknown Coinbase error';
    const error = new Error(`Coinbase ${label} failed: ${detail}`);
    error.status = res.status;
    error.code = data?.error?.type || data?.error?.code || res.status;
    error.body = data || text;
    error.detail = detail;
    throw error;
  }
  return data || {};
};

const isChargeDeprecatedError = (error) => {
  if (!error || error.status !== 403) return false;
  const type =
    (error.body && error.body.error && error.body.error.type) || error.code || '';
  const message =
    (error.body && error.body.error && error.body.error.message) ||
    error.detail ||
    error.message ||
    '';
  return (
    CHARGE_DEPRECATED_REGEX.test(message) &&
    String(type || '').toLowerCase().includes('forbidden')
  );
};

exports.createCheckout = (apiKey, params) => {
  return coinbaseRequest(apiKey, '/checkouts', params, 'createCheckout');
};

/**
 * Create a Coinbase Commerce charge.
 * Automatically falls back to a checkout when the account is no longer
 * permitted to create legacy charges (Coinbase now restricts charge creation
 * for newer accounts).
 *
 * @param {string} apiKey - Coinbase Commerce API key.
 * @param {object} params - Charge parameters.
 * @returns {Promise<object>} Charge response.
 */
exports.createCharge = async (apiKey, params) => {
  try {
    return await coinbaseRequest(apiKey, '/charges', params, 'createCharge');
  } catch (error) {
    if (isChargeDeprecatedError(error)) {
      return exports.createCheckout(apiKey, params);
    }
    throw error;
  }
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
