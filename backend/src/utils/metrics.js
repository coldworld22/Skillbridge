// 📁 src/utils/metrics.js
const logger = require("./logger");

const defaultTags = {
  env: process.env.NODE_ENV || "development",
};

const formatTags = (tags = {}) =>
  Object.fromEntries(
    Object.entries({ ...defaultTags, ...tags }).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

const incrementCounter = (name, tags = {}, value = 1) => {
  const payload = {
    metric: name,
    type: "counter",
    value,
    tags: formatTags(tags),
    timestamp: new Date().toISOString(),
  };
  logger.log?.("metric", JSON.stringify(payload));
};

module.exports = { incrementCounter };
