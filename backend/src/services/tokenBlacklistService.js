const db = require('../config/database');
const logger = require('../utils/logger.js');
const crypto = require('crypto');

/**
 * Inserts a token into the blacklist store.
 * @param {string} token
 * @returns {Promise<void>}
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function addToken(token) {
  if (!token) return;
  try {
    const tokenHash = hashToken(token);
    await db('blacklisted_tokens')
      .insert({ token_hash: tokenHash })
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
    .first();
  return !!record;
}

module.exports = {
  addToken,
  isTokenBlacklisted,
};
