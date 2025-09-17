const db = require('../../config/database');

const ADMIN_ROLES = ['Admin', 'SuperAdmin'];
let cachedHasAdmin = null;

const isMissingTableError = (error) => {
  if (!error) return false;
  if (error.code === '42P01') return true; // PostgreSQL missing table
  const message = String(error.message || '').toLowerCase();
  return message.includes('no such table') || message.includes('does not exist');
};

const queryAdminPresence = async (trx = db) => {
  try {
    const record = await trx('users').whereIn('role', ADMIN_ROLES).first();
    return Boolean(record);
  } catch (error) {
    if (isMissingTableError(error)) {
      cachedHasAdmin = false;
      return false;
    }
    throw error;
  }
};

const hasExistingAdmin = async ({ bypassCache = false } = {}) => {
  if (!bypassCache && cachedHasAdmin === true) {
    return true;
  }
  const exists = await queryAdminPresence();
  cachedHasAdmin = exists;
  return exists;
};

const refreshAdminPresence = async () => {
  const exists = await queryAdminPresence();
  cachedHasAdmin = exists;
  return exists;
};

const markAdminExists = () => {
  cachedHasAdmin = true;
};

module.exports = {
  hasExistingAdmin,
  refreshAdminPresence,
  markAdminExists,
};
