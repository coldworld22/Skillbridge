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
