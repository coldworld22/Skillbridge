export function parseCheckoutItems(value) {
  if (!value) return null;

  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return null;

  // Step 1: decode once. If decoding fails, fall back to the raw string.
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // ignore decode errors and use the raw string
  }

  // Step 2: attempt to parse JSON. Invalid JSON results in null.
  let parsed;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    return null;
  }

  // Step 3: verify structure and required fields. Accept the first item if multiple were passed.
  if (!Array.isArray(parsed) || parsed.length < 1) return null;
  const item = parsed[0];
  if (!item || typeof item !== 'object' || !item.id) return null;

  return {
    id: item.id,
    type: item.itemType || item.item_type || 'class',
  };
}

export default parseCheckoutItems;
