const AppError = require("../../utils/AppError");
const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");

const SETTINGS_KEY = "app_settings";

exports.getSettings = async () => {
  try {
    return (await readJsonSetting(SETTINGS_KEY)) || {};
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error("[appConfig] Failed to load application settings", err);
    throw new AppError(
      "Unable to load application settings. Please verify the database connection.",
      503
    );
  }
};

exports.updateSettings = async (settings) => {
  try {
    await writeJsonSetting(SETTINGS_KEY, settings);
    return settings;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error("[appConfig] Failed to update application settings", err);
    throw new AppError(
      "Unable to update application settings. Please retry after the database connection is restored.",
      503
    );
  }
};
