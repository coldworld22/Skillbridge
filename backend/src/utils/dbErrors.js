const logger = require("./logger");

const UNDEFINED_TABLE_CODE = "42P01";

/**
 * Determine whether the provided error corresponds to a missing table in
 * PostgreSQL (error code 42P01).
 *
 * @param {unknown} error
 * @param {string} [tableName] Optional table name to match in the error message
 * @returns {boolean}
 */
function isUndefinedTableError(error, tableName) {
  if (!error || typeof error !== "object") return false;
  if (error.code !== UNDEFINED_TABLE_CODE) return false;

  if (!tableName) return true;

  const message = error.message || "";
  if (typeof message !== "string") return true;

  return message.includes(`relation "${tableName}"`);
}

/**
 * Emit a standard warning explaining that a table is missing along with the
 * recommended remediation steps. This keeps messaging consistent across
 * services that depend on the same table.
 *
 * @param {string} tableName
 * @param {string} [context]
 */
function logUndefinedTableWarning(tableName, context) {
  const prefix = context ? `[${context}] ` : "";
  logger.warn(
    `${prefix}Database table "${tableName}" is missing. ` +
      'Run "npm run migrate" to initialize the database schema.'
  );
}

module.exports = {
  UNDEFINED_TABLE_CODE,
  isUndefinedTableError,
  logUndefinedTableWarning,
};
