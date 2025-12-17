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
const normalizeInt = (value, { positive = false } = {}) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return undefined;
  if (positive && num <= 0) return undefined;
  return num;
};

const normalizeBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(lowered)) return true;
    if (["false", "0", "no", "off"].includes(lowered)) return false;
  }
  return Boolean(value);
};

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

  return parsed
    .filter((ch) => ch && ch.title)
    .map((ch, index) => {
      const duration = normalizeInt(ch.duration);
      let order = normalizeInt(ch.order, { positive: true });
      if (!order) order = index + 1;

      return {
        title: ch.title,
        content: ch.content || undefined,
        video_url: typeof ch.video_url === "string" ? ch.video_url : undefined,
        duration,
        order,
        is_preview: normalizeBoolean(ch.is_preview),
      };
    });
}

module.exports = { parseTags, parseChapters };
