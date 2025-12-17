const levels = ["log", "warn", "error"];
const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || (process.env.NODE_ENV === "production" ? "error" : "log");
const levelIndex = levels.indexOf(envLevel);
const currentLevel = levelIndex === -1 ? (process.env.NODE_ENV === "production" ? 2 : 0) : levelIndex;

const logger = {
  log: (...args) => {
    if (currentLevel <= 0) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (currentLevel <= 1) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (currentLevel <= 2) {
      console.error(...args);
    }
  },
};

export default logger;
