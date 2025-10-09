const AppError = require("./AppError");
const db = require("../config/database");
const logger = require("./logger");
const {
  isUndefinedTableError,
  logUndefinedTableWarning,
} = require("./dbErrors");

const SETTINGS_TABLE = "settings";
const MIGRATION_HINT =
  'The "settings" table is missing. Run "npm run migrate" to initialize the database schema before using configuration endpoints.';

async function readJsonSetting(key) {
  let row;
  try {
    row = await db(SETTINGS_TABLE).where({ key }).first();
  } catch (error) {
    if (isUndefinedTableError(error, SETTINGS_TABLE)) {
      logUndefinedTableWarning(SETTINGS_TABLE, "settingsStore.readJsonSetting");
      return null;
    }
    throw error;
  }

  if (!row) return null;

  try {
    return JSON.parse(row.value);
  } catch (error) {
    logger.warn(
      `[settingsStore] Failed to parse JSON for key "${key}". Returning null instead.`,
      error
    );
    return null;
  }
}

async function writeJsonSetting(key, value) {
  const serializable = value === undefined ? null : value;
  const payload = JSON.stringify(serializable);

  try {
    const existing = await db(SETTINGS_TABLE).where({ key }).first();
    if (existing) {
      await db(SETTINGS_TABLE)
        .where({ key })
        .update({ value: payload, updated_at: db.fn.now() });
    } else {
      await db(SETTINGS_TABLE).insert({ key, value: payload });
    }
  } catch (error) {
    if (isUndefinedTableError(error, SETTINGS_TABLE)) {
      logger.error(`[settingsStore] ${MIGRATION_HINT}`);
      throw new AppError(
        "Settings storage has not been initialized. Please run the database migrations.",
        503
      );
    }
    throw error;
  }

  return serializable;
}

module.exports = {
  MIGRATION_HINT,
  SETTINGS_TABLE,
  readJsonSetting,
  writeJsonSetting,
};
