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

/**
 * Parse chapter data from request body into a normalized array.
 * Accepts an array or JSON string; filters out chapters missing a title.
 *
 * @param {string|string[]|undefined|null} rawChapters
 * @returns {Array<{title:string, video_url?:string, duration?:number, order?:number, is_preview?:boolean}>}
 */
function parseChapters(rawChapters) {
  if (rawChapters === undefined || rawChapters === null || rawChapters === "") {
    return [];
  }

  let parsed = rawChapters;
  if (typeof rawChapters === "string") {
    try {
      parsed = JSON.parse(rawChapters);
    } catch (err) {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter((ch) => ch && ch.title);
}

module.exports = { parseTags, parseChapters };
