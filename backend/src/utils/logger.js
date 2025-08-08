// 📁 src/utils/logger.js
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
const LOG_FILE = path.join(LOG_DIR, "error.log");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function append(type, args) {
  const line = `${new Date().toISOString()} [${type}] ${args.join(" ")}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (_) {
    // fail silently
  }
}

module.exports = {
  log: (...args) => {
    append("INFO", args);
    console.log("[LOG]", ...args);
  },
  debug: (...args) => {
    append("DEBUG", args);
    console.debug("[DEBUG]", ...args);
  },
  warn: (...args) => {
    append("WARN", args);
    console.warn("[WARN]", ...args);
  },
  error: (...args) => {
    append("ERROR", args);
    console.error("[ERROR]", ...args);
  },
};
