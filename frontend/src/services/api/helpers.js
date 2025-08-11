// Normalize API responses by always returning the payload array or object.
// Falls back to an empty array when no data is available.
export const extractData = (res) => res?.data?.data ?? res?.data ?? [];
