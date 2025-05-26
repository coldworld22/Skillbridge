// 📁 src/utils/logger.js
module.exports = {
  log: (...args) => console.log("[LOG]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
};