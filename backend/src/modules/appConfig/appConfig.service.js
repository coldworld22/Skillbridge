const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger.js");

const SETTINGS_KEY = "app_settings";

exports.getSettings = async () => {
  try {
    const row = await db("settings").where({ key: SETTINGS_KEY }).first();
    if (!row) return {};
    try {
      return JSON.parse(row.value);
    } catch (_err) {
      logger.warn("[appConfig] Stored settings payload is not valid JSON");
      return {};
    }
  } catch (err) {
    logger.error("[appConfig] Failed to load settings from the database", err);
    throw new AppError(
      "Unable to load application settings. Please verify the database connection.",
      503
    );
  }
};

exports.updateSettings = async (settings) => {
  try {
    const value = JSON.stringify(settings);
    const existing = await db("settings").where({ key: SETTINGS_KEY }).first();
    if (existing) {
      await db("settings")
        .where({ key: SETTINGS_KEY })
        .update({ value, updated_at: db.fn.now() });
    } else {
      await db("settings").insert({ key: SETTINGS_KEY, value });
    }
    return settings;
  } catch (err) {
    logger.error("[appConfig] Failed to persist settings", err);
    throw new AppError(
      "Unable to update application settings. Please retry after the database connection is restored.",
      503
    );
  }
};
