const db = require("../../config/database");

const SETTINGS_KEY = "app_settings";

exports.getSettings = async () => {
  const row = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (!row) return {};
  try {
    return JSON.parse(row.value);
  } catch (_err) {
    return {};
  }
};

exports.updateSettings = async (settings) => {
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
