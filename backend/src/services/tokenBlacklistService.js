const db = require('../config/database');
const logger = require('../utils/logger.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Inserts a token into the blacklist store.
 * @param {string} token
 * @returns {Promise<void>}
 */
async function addToken(token) {
  if (!token) return;

  const tokenHash = hashToken(token);

  let expiresAt = null;
  try {
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      expiresAt = new Date(decoded.exp * 1000);
    }
  } catch (err) {
    logger.warn('Failed to decode token for blacklist expiry:', err);
  }

  try {
    const tokenHash = hashToken(token);
    await db('blacklisted_tokens')
      .insert({ token_hash: tokenHash, expires_at: expiresAt })
      .onConflict('token_hash')
      .ignore();
  } catch (err) {
    logger.error('Failed to add token to blacklist:', err);
    throw err;
  }
}

/**
 * Checks whether the token exists in blacklist store.
 * @param {string} token
 * @returns {Promise<boolean>}
 */
async function isTokenBlacklisted(token) {
  if (!token) return false;
  const tokenHash = hashToken(token);
  const record = await db('blacklisted_tokens')
    .where({ token_hash: tokenHash })
    .andWhere('expires_at', '>', db.fn.now())
    .first();
  return !!record;
}

/**
 * Removes expired tokens from the blacklist.
 * @returns {Promise<number>} Number of removed entries
 */
async function removeExpiredTokens() {
  return db('blacklisted_tokens').where('expires_at', '<', db.fn.now()).del();
}

module.exports = {
  addToken,
  isTokenBlacklisted,
  removeExpiredTokens,
};
