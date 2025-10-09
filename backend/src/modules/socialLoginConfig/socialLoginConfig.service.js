const logger = require('../../utils/logger.js');
const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");
const fs = require("fs");
const path = require("path");

const SETTINGS_KEY = "social_login_settings";

exports.getSettings = async () => {
  try {
    return await readJsonSetting(SETTINGS_KEY);
  } catch (err) {
    logger.error("Failed to load social login settings", err);
    return null;
  }
};

exports.updateSettings = async (settings) => {
  await writeJsonSetting(SETTINGS_KEY, settings);
  await saveToEnv(settings);
  return settings;
};

function saveToEnv(settings) {
  const envPath = path.join(__dirname, '../../../.env');
  let env = '';
  try {
    env = fs.readFileSync(envPath, 'utf8');
  } catch (_err) {
    env = '';
  }

  const remove = (key) => {
    const regex = new RegExp(`^${key}=.*\n?`, 'gm');
    env = env.replace(regex, '');
    env = env.replace(/\n{2,}/g, '\n').replace(/^\n|\n$/g, '');
  };

  const upsert = (key, val) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (val) {
      const line = `${key}=${val.toString().replace(/\n/g, '\\n')}`;
      if (regex.test(env)) {
        env = env.replace(regex, line);
      } else {
        env = env ? `${env}\n${line}` : line;
      }
    } else {
      remove(key);
    }
  };

  const p = settings.providers || {};

  upsert('GOOGLE_CLIENT_ID', p.google?.clientId);
  upsert('GOOGLE_CLIENT_SECRET', p.google?.clientSecret);
  upsert('FACEBOOK_CLIENT_ID', p.facebook?.clientId);
  upsert('FACEBOOK_CLIENT_SECRET', p.facebook?.clientSecret);
  upsert('GITHUB_CLIENT_ID', p.github?.clientId);
  upsert('GITHUB_CLIENT_SECRET', p.github?.clientSecret);

  if (p.apple?.active) {
    upsert('APPLE_CLIENT_ID', p.apple?.clientId);
    upsert('APPLE_TEAM_ID', p.apple?.teamId);
    upsert('APPLE_KEY_ID', p.apple?.keyId);
    upsert('APPLE_PRIVATE_KEY', p.apple?.privateKey);
  } else {
    remove('APPLE_CLIENT_ID');
    remove('APPLE_TEAM_ID');
    remove('APPLE_KEY_ID');
    remove('APPLE_PRIVATE_KEY');
  }

  fs.writeFileSync(envPath, env);
}
