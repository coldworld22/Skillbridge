const AppError = require("../../utils/AppError");
const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");

const SETTINGS_KEY = "app_settings";

exports.getSettings = async () => {
  try {
    return (await readJsonSetting(SETTINGS_KEY)) || {};
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Unable to load application settings. Please verify the database connection.",
      503,
      error
    );
  }
};

exports.updateSettings = async (settings) => {
  try {
    await writeJsonSetting(SETTINGS_KEY, settings);
    return settings;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Unable to update application settings. Please retry after the database connection is restored.",
      503,
      error
    );
  }
};
