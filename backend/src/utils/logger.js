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

const createNoopStream = () =>
  new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });

const isWritableStream = (stream) =>
  Boolean(stream) && !stream.destroyed && !stream.writableEnded && stream.writable !== false;

const cleanupStream = (stream) => {
  if (stream && typeof stream.removeListener === "function") {
    stream.removeListener("error", handleLogStreamError);
  }
  if (stream && typeof stream.destroy === "function" && !stream.destroyed) {
    stream.destroy();
  }
};

const attachStreamHandlers = (stream) => {
  if (!stream) {
    return null;
  }
  stream.on("error", handleLogStreamError);
  return stream;
};

const initialiseLogStream = (preferredDirs = [DEFAULT_LOG_DIR, FALLBACK_LOG_DIR]) => {
  for (const dir of preferredDirs) {
    const stream = attachStreamHandlers(createLogStream(dir));
    if (stream) {
      return stream;
    }
  }

  return attachStreamHandlers(createNoopStream());
};

let logStream = initialiseLogStream();

function handleLogStreamError(err) {
  console.error("Failed to write to log file:", err);
  cleanupStream(logStream);
  logStream = initialiseLogStream([FALLBACK_LOG_DIR]);
}

const ensureLogStream = () => {
  if (!isWritableStream(logStream)) {
    logStream = initialiseLogStream();
  }
  return logStream;
};

process.on("exit", () => {
  if (isWritableStream(logStream)) {
    logStream.end();
  }
});

const gracefulShutdown = () => {
  if (isWritableStream(logStream)) {
    logStream.end(() => process.exit(0));
    return;
  }
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

function append(type, args) {
  const stream = ensureLogStream();
  if (!isWritableStream(stream)) {
    return;
  }

  const line = `${new Date().toISOString()} [${type}] ${args.join(" ")}\n`;
  stream.write(line, (err) => {
    if (err) {
      handleLogStreamError(err);
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
