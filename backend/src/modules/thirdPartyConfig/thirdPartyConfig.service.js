const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");

const SETTINGS_KEY = "third_party_settings";

exports.getSettings = async () => {
  const parsed = await readJsonSetting(SETTINGS_KEY);
  if (parsed && Object.prototype.hasOwnProperty.call(parsed, "recaptcha")) {
    delete parsed.recaptcha;
    await writeJsonSetting(SETTINGS_KEY, parsed);
  }
  return parsed;
};

exports.updateSettings = async (settings) => {
  const { recaptcha, ...rest } = settings || {};
  const prev = (await exports.getSettings()) || {};
  const merged = { ...prev, ...rest };
  await writeJsonSetting(SETTINGS_KEY, merged);
  return merged;
};
