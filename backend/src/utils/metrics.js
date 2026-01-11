// 📁 src/utils/metrics.js
// Lightweight in-process counters for operational visibility.

const logger = require("./logger");

const counters = new Map();

const keyFor = (name, tags) => {
  if (!tags || Object.keys(tags).length === 0) return name;
  return `${name}:${JSON.stringify(tags)}`;
};

const increment = (name, tags = {}) => {
  const key = keyFor(name, tags);
  const next = (counters.get(key) || 0) + 1;
  counters.set(key, next);
  logger.warn?.("metric_increment", { name, count: next, ...tags });
  return next;
};

const snapshot = () => {
  const data = {};
  for (const [key, value] of counters.entries()) {
    data[key] = value;
  }
  return data;
};

module.exports = {
  increment,
  snapshot,
};
