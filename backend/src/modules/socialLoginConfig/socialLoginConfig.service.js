const db = require("../../config/database");
const fs = require("fs");
const path = require("path");

const SETTINGS_KEY = "social_login_settings";

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
  const value = JSON.stringify(settings);
  const existing = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (existing) {
    await db("settings")
      .where({ key: SETTINGS_KEY })
      .update({ value, updated_at: db.fn.now() });
  } else {
    await db("settings").insert({ key: SETTINGS_KEY, value });
  }
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

  const upsert = (key, val) => {
    if (!val) return;
    const line = `${key}=${val.toString().replace(/\n/g, '\\n')}`;
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(env)) {
      env = env.replace(regex, line);
    } else {
      env = env ? `${env}\n${line}` : line;
    }
  };

  const p = settings.providers || {};

  upsert('GOOGLE_CLIENT_ID', p.google?.clientId);
  upsert('GOOGLE_CLIENT_SECRET', p.google?.clientSecret);
  upsert('FACEBOOK_CLIENT_ID', p.facebook?.clientId);
  upsert('FACEBOOK_CLIENT_SECRET', p.facebook?.clientSecret);
  upsert('GITHUB_CLIENT_ID', p.github?.clientId);
  upsert('GITHUB_CLIENT_SECRET', p.github?.clientSecret);
  upsert('APPLE_CLIENT_ID', p.apple?.clientId);
  upsert('APPLE_TEAM_ID', p.apple?.teamId);
  upsert('APPLE_KEY_ID', p.apple?.keyId);
  upsert('APPLE_PRIVATE_KEY', p.apple?.privateKey);

  fs.writeFileSync(envPath, env);
}
