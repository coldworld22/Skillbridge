export const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item));
  }
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase();
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

export const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item));
  }
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const camelKey = key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
      acc[camelKey] = toCamelCase(value);
      return acc;
    }, {});
  }
  return obj;
};
