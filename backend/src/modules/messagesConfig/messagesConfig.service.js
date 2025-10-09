const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");

const SETTINGS_KEY = "messages_settings";

exports.getSettings = async () => {
  return await readJsonSetting(SETTINGS_KEY);
};

exports.updateSettings = async (settings) => {
  // Ensure only one Gateway provider is active and default
  if (Array.isArray(settings?.providers)) {
    let activeSet = false;
    let defaultSet = false;
    settings.providers = settings.providers.map((p) => {
      if (p.type === "Gateway") {
        if (p.active) {
          if (!activeSet) activeSet = true;
          else p.active = false;
        }
        if (p.isDefault) {
          if (!defaultSet) defaultSet = true;
          else p.isDefault = false;
        }
      }
      return p;
    });
  }

  await writeJsonSetting(SETTINGS_KEY, settings);
  return settings;
};
