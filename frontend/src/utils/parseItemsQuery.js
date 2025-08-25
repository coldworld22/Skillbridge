import qs from 'qs';

// Parse the `items` query parameter into an object containing `id` and `type`.
// Returns `null` if parsing fails or the expected structure is absent.
export function parseItemsQuery(value) {
  if (!value) return null;

  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return null;

  try {
    // Decode once or twice to handle single or double encoded values.
    let decoded = raw;
    for (let i = 0; i < 2 && typeof decoded === 'string'; i += 1) {
      const parsed = qs.parse(`i=${decoded}`);
      decoded = parsed.i;
    }
    const arr = JSON.parse(decoded);
    if (Array.isArray(arr) && arr.length === 1 && arr[0]?.id) {
      const item = arr[0];
      return {
        id: item.id,
        type: item.itemType || item.item_type || 'class',
      };
    }
  } catch {
    // fall through to return null
  }
  return null;
}
