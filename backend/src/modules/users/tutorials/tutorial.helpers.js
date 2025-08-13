const AppError = require("../../../utils/AppError");

/**
 * Safely parse tags from request input.
 * Accepts an array or a JSON string representing an array.
 * Returns an array of tag names. Throws AppError on invalid input.
 *
 * @param {string|string[]|undefined|null} rawTags
 * @returns {string[]}
 */
function parseTags(rawTags) {
  if (rawTags === undefined || rawTags === null || rawTags === '') {
    return [];
  }

  if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags);
      if (!Array.isArray(parsed)) {
        throw new Error('Tags JSON is not an array');
      }
      return parsed;
    } catch (err) {
      throw new AppError('Invalid tags JSON', 400);
    }
  }

  if (Array.isArray(rawTags)) {
    return rawTags;
  }

  throw new AppError('Invalid tags JSON', 400);
}

module.exports = { parseTags };
