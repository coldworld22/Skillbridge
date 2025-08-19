const db = require("../../config/database");

const SETTINGS_KEY = "third_party_settings";

exports.getSettings = async () => {
  const row = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value);
    if (parsed && Object.prototype.hasOwnProperty.call(parsed, "recaptcha")) {
      delete parsed.recaptcha;
      await db("settings")
        .where({ key: SETTINGS_KEY })
        .update({ value: JSON.stringify(parsed), updated_at: db.fn.now() });
    }
    return parsed;
  } catch (_err) {
    return null;
  }
};

exports.updateSettings = async (settings) => {
  const { recaptcha, ...rest } = settings || {};
  const prev = (await exports.getSettings()) || {};
  const merged = { ...prev, ...rest };
  const value = JSON.stringify(merged);
  const existing = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (existing) {
    await db("settings")
      .where({ key: SETTINGS_KEY })
      .update({ value, updated_at: db.fn.now() });
  } else {
    await db("settings").insert({ key: SETTINGS_KEY, value });
  }
  return merged;
};
