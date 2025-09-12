const db = require('../config/database');
const logger = require('../utils/logger.js');

/**
 * Inserts a token into the blacklist store.
 * @param {string} token
 * @returns {Promise<void>}
 */
async function addToken(token) {
  if (!token) return;
  try {
    await db('blacklisted_tokens').insert({ token }).onConflict('token').ignore();
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
  const record = await db('blacklisted_tokens').where({ token }).first();
  return !!record;
}

module.exports = {
  addToken,
  isTokenBlacklisted,
};
