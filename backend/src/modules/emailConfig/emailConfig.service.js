const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");

const SETTINGS_KEY = "email_settings";

exports.getSettings = async () => {
  return await readJsonSetting(SETTINGS_KEY);
};

exports.updateSettings = async (settings) => {
  await writeJsonSetting(SETTINGS_KEY, settings);
  return settings;
};
