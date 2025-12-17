const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");

const SETTINGS_KEY = "policy_pages";

exports.getPolicies = async () => {
  return (await readJsonSetting(SETTINGS_KEY)) || {};
};

exports.updatePolicies = async (policies) => {
  await writeJsonSetting(SETTINGS_KEY, policies);
  return policies;
};
