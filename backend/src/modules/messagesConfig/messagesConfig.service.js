const db = require("../../config/database");

const SETTINGS_KEY = "messages_settings";

exports.getSettings = async () => {
  const row = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch (_err) {
    return null;
  }
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
};
