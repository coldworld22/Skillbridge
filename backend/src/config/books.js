const logger = require('../utils/logger.js');

/**
 * Parse a numeric environment variable.
 * Falls back to a default when the value is not a finite number.
 * @param {string|undefined} value Raw environment variable
 * @param {number} fallback Default value to use when parsing fails
 * @param {string} name Name of the environment variable for logging
 * @returns {number}
 */
function parseEnvNumber(value, fallback, name) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  if (value !== undefined) {
    logger.warn(
      `Invalid ${name} environment value: ${value}. Falling back to ${fallback}.`
    );
  }

  return fallback;
}

const PRICE_RANGE_DEFAULT = parseEnvNumber(
  process.env.BOOK_PRICE_RANGE_DEFAULT,
  100,
  'BOOK_PRICE_RANGE_DEFAULT'
);

const PRICE_RANGE_MAX = parseEnvNumber(
  process.env.BOOK_PRICE_RANGE_MAX,
  500,
  'BOOK_PRICE_RANGE_MAX'
);

module.exports = {
  PRICE_RANGE_DEFAULT,
  PRICE_RANGE_MAX,
};
