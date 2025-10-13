// 📁 src/utils/logger.js
const fs = require("fs");
const path = require("path");

const env = process.env.NODE_ENV || "development";
const isProd = env === "production";
const isTest = env === "test";

let logStream = null;
if (!isTest) {
  const LOG_DIR = path.join(__dirname, "../../logs");
  const LOG_FILE = path.join(LOG_DIR, "error.log");
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
  }
  logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });
  logStream.on("error", (err) => {
    // Avoid recursive logging if console is patched; keep minimal
    if (!isTest) console.error("Failed to write to log file:", err);
  });
}

function append(type, args) {
  if (isTest) return; // Silence logs entirely during tests
  if (!logStream) return;
  const line = `${new Date().toISOString()} [${type}] ${args.join(" ")}\n`;
  logStream.write(line, () => {});
}

module.exports = {
  log: (...args) => {
    append("INFO", args);
    if (!isProd && !isTest) console.log("[LOG]", ...args);
  },
  debug: (...args) => {
    append("DEBUG", args);
    if (!isProd && !isTest) console.debug("[DEBUG]", ...args);
  },
  warn: (...args) => {
    append("WARN", args);
    if (!isProd && !isTest) console.warn("[WARN]", ...args);
  },
  error: (...args) => {
    append("ERROR", args);
    if (!isTest) console.error("[ERROR]", ...args);
  },
};
