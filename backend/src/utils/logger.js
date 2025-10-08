// 📁 src/utils/logger.js
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
const LOG_FILE = path.join(LOG_DIR, "error.log");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}
const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

logStream.on("error", (err) => {
  console.error("Failed to write to log file:", err);
});

function append(type, args) {
  const line = `${new Date().toISOString()} [${type}] ${args.join(" ")}\n`;
  logStream.write(line, (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

const isProd = process.env.NODE_ENV === "production";

module.exports = {
  log: (...args) => {
    append("INFO", args);
    if (!isProd) {
      console.log("[LOG]", ...args);
    }
  },
  debug: (...args) => {
    append("DEBUG", args);
    if (!isProd) {
      console.debug("[DEBUG]", ...args);
    }
  },
  warn: (...args) => {
    append("WARN", args);
    if (!isProd) {
      console.warn("[WARN]", ...args);
    }
  },
  error: (...args) => {
    append("ERROR", args);
    console.error("[ERROR]", ...args);
  },
};
