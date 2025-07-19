const db = require("../../config/database");

const SETTINGS_KEY = "policy_pages";

exports.getPolicies = async () => {
  const row = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (!row) return {};
  try {
    return JSON.parse(row.value);
  } catch (_err) {
    return {};
  }
};

exports.updatePolicies = async (policies) => {
  const value = JSON.stringify(policies);
  const existing = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (existing) {
    await db("settings")
      .where({ key: SETTINGS_KEY })
      .update({ value, updated_at: db.fn.now() });
  } else {
    await db("settings").insert({ key: SETTINGS_KEY, value });
  }
  return policies;
};
