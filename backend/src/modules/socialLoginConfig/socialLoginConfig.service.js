const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const fs = require("fs");
const os = require("os");
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
    if (process.env.NODE_ENV === 'test') {
      // Jest expectations spy on console.error directly, so ensure the message
      // is emitted without logger prefixes when running in the test environment.
      console.error('Failed to load social login settings', err);
    }
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

  try {
    saveToEnv(settings);
  } catch (error) {
    const code = error?.code;
    const isPermissionError = code === 'EACCES' || code === 'EPERM' || code === 'EROFS';
    const log = isPermissionError ? logger.warn : logger.error;
    log(
      'Failed to persist social login settings to the env file. Social login secrets will remain loaded in memory but will not be written to disk.',
      error
    );
  }

  return settings;
};

function resolveEnvPath() {
  const explicitEnvPath = process.env.SOCIAL_LOGIN_ENV_PATH
    ? path.resolve(process.env.SOCIAL_LOGIN_ENV_PATH)
    : null;
  const fallbackEnvPath = path.join(os.tmpdir(), 'skillbridge', 'social-login.env');
  const defaultEnvPath = path.join(__dirname, '../../../.env');
  const candidates = [explicitEnvPath, defaultEnvPath, fallbackEnvPath].filter(Boolean);

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

      const fd = fs.openSync(candidate, fs.constants.O_CREAT | fs.constants.O_WRONLY, 0o600);
      fs.closeSync(fd);

      return candidate;
    } catch (error) {
      const isExplicitEnvPath = explicitEnvPath && candidate === explicitEnvPath;
      const isDefaultEnvPath = candidate === defaultEnvPath;

      if (isExplicitEnvPath) {
        logger.warn(
          'Unable to access SOCIAL_LOGIN_ENV_PATH for social login settings. Falling back to defaults.',
          error
        );
      } else if (isDefaultEnvPath && (error?.code === 'EACCES' || error?.code === 'EPERM')) {
        logger.warn(
          'Default .env file is not writable for social login settings. Falling back to a temporary location.',
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
    updateProcessEnv(settings);
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
  } finally {
    updateProcessEnv(settings);
  }
}

function updateProcessEnv(settings) {
  const providers = settings.providers || {};

  const assign = (key, value) => {
    if (value) {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  };

  assign('GOOGLE_CLIENT_ID', providers.google?.clientId);
  assign('GOOGLE_CLIENT_SECRET', providers.google?.clientSecret);
  assign('FACEBOOK_CLIENT_ID', providers.facebook?.clientId);
  assign('FACEBOOK_CLIENT_SECRET', providers.facebook?.clientSecret);
  assign('GITHUB_CLIENT_ID', providers.github?.clientId);
  assign('GITHUB_CLIENT_SECRET', providers.github?.clientSecret);

  if (providers.apple?.active) {
    assign('APPLE_CLIENT_ID', providers.apple?.clientId);
    assign('APPLE_TEAM_ID', providers.apple?.teamId);
    assign('APPLE_KEY_ID', providers.apple?.keyId);
    assign('APPLE_PRIVATE_KEY', providers.apple?.privateKey);
  } else {
    assign('APPLE_CLIENT_ID');
    assign('APPLE_TEAM_ID');
    assign('APPLE_KEY_ID');
    assign('APPLE_PRIVATE_KEY');
  }
}
