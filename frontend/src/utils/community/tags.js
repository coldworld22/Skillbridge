const splitTags = (value) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

/**
 * Normalizes a tag payload coming from the API (array or JSON/string)
 * into a stable, de-duplicated array of strings.
 */
export const safeParseTags = (raw) => {
  if (Array.isArray(raw)) {
    return [...new Set(raw.filter(Boolean))];
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.filter(Boolean))];
      }
    } catch (_err) {
      return [...new Set(splitTags(trimmed))];
    }

    return splitTags(trimmed);
  }

  return [];
};

/**
 * Utility helper to merge multiple tag collections (arrays/strings) together.
 * Accepts variadic input to keep UI code tidy.
 */
export const mergeTagCollections = (...collections) => {
  const tagSet = new Set();
  collections.forEach((collection) => {
    safeParseTags(collection).forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet);
};
