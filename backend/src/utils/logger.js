// 📁 src/utils/logger.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Writable } = require("stream");

const DEFAULT_LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "../../logs");
const FALLBACK_LOG_DIR = path.join(os.tmpdir(), "skillbridge-logs");

const createLogStream = (logDir) => {
  const logFile = path.join(logDir, "error.log");

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    return fs.createWriteStream(logFile, { flags: "a" });
  } catch (err) {
    if (err && (err.code === "EACCES" || err.code === "EPERM")) {
      console.warn(
        `Unable to access log directory "${logDir}" due to permissions. Falling back to console logging.`,
      );
      return null;
    }
    throw err;
  }
};

let logStream = createLogStream(DEFAULT_LOG_DIR);

if (!logStream && DEFAULT_LOG_DIR !== FALLBACK_LOG_DIR) {
  logStream = createLogStream(FALLBACK_LOG_DIR);
}

if (!logStream) {
  logStream = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
}

logStream.on("error", (err) => {
  console.error("Failed to write to log file:", err);
});

process.on("exit", () => logStream.end());

const gracefulShutdown = () => {
  logStream.end(() => process.exit(0));
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

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
