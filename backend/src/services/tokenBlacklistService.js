const db = require('../config/database');

/**
 * Inserts a token into the blacklist store.
 * @param {string} token
 * @returns {Promise<void>}
 */
let tokenColumnChecked = false;
let hasTokenColumn = true;

async function ensureTokenColumn() {
  if (!tokenColumnChecked) {
    try {
      hasTokenColumn = await db.schema.hasColumn('blacklisted_tokens', 'token');
    } catch (_err) {
      hasTokenColumn = false;
    }
    tokenColumnChecked = true;
  }
  return hasTokenColumn;
}

async function addToken(token) {
  if (!token) return;
  if (!(await ensureTokenColumn())) return;
  try {
    await db('blacklisted_tokens').insert({ token }).onConflict('token').ignore();
  } catch (err) {
    // log or ignore
  }
}

/**
 * Checks whether the token exists in blacklist store.
 * @param {string} token
 * @returns {Promise<boolean>}
 */
async function isTokenBlacklisted(token) {
  if (!token) return false;
  if (!(await ensureTokenColumn())) return false;
  const record = await db('blacklisted_tokens').where({ token }).first();
  return !!record;
}

module.exports = {
  addToken,
  isTokenBlacklisted,
};
