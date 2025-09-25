const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const fs = require("fs");
const path = require("path");

const SETTINGS_KEY = "social_login_settings";

exports.getSettings = async () => {
  try {
    const row = await db("settings").where({ key: SETTINGS_KEY }).first();
    if (!row) return null;
    try {
      return JSON.parse(row.value);
    } catch (_err) {
      return null;
    }
  } catch (err) {
    logger.error("Failed to load social login settings", err);
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

function resolveEnvPath() {
  const candidates = [
    process.env.SOCIAL_LOGIN_ENV_PATH && path.resolve(process.env.SOCIAL_LOGIN_ENV_PATH),
    path.join(__dirname, '../../../.env'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const dir = path.dirname(candidate);
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (mkdirError) {
        if (mkdirError?.code !== 'EEXIST') {
          throw mkdirError;
        }
      }
      fs.accessSync(dir, fs.constants.W_OK);
      return candidate;
    } catch (error) {
      if (candidate === process.env.SOCIAL_LOGIN_ENV_PATH) {
        logger.warn(
          'Unable to access SOCIAL_LOGIN_ENV_PATH for social login settings. Falling back to defaults.',
          error
        );
      }
    }
  }

  return null;
}

function saveToEnv(settings) {
  const envPath = resolveEnvPath();
  if (!envPath) {
    logger.warn('Skipping .env update for social login settings because no writable env file was found.');
    return;
  }

  let env = '';
  try {
    env = fs.readFileSync(envPath, 'utf8');
  } catch (err) {
    if (err?.code !== 'ENOENT') {
      logger.warn('Failed to read existing env file for social login settings. Proceeding with a blank file.', err);
    }
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

  try {
    fs.writeFileSync(envPath, env, 'utf8');
  } catch (error) {
    logger.error('Failed to persist social login settings to the env file.', error);
  }
}
