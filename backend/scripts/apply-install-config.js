#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const sanitizeFilename = require('sanitize-filename');
const mime = require('mime-types');

const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const LogoFileSchema = z.object({
  filename: z.string().trim().min(1),
  data: z
    .string()
    .trim()
    .min(1)
    .refine((value) => base64Pattern.test(value.replace(/\s+/g, '')), {
      message: 'Logo file data must be base64 encoded.',
    }),
  contentType: z.string().trim().min(1).optional(),
});

const InstallerConfigSchema = z
  .object({
    app: z
      .object({
        name: z.string().trim().min(1).max(120).optional(),
      })
      .optional(),
    support: z
      .object({
        email: z.string().trim().email().optional(),
        url: z.string().trim().url().optional(),
      })
      .optional(),
    smtp: z
      .object({
        host: z.string().trim().min(1).max(255).optional(),
        port: z.number().int().min(1).max(65535).optional(),
        secure: z.boolean().optional(),
        username: z.string().trim().min(1).max(255).optional(),
        password: z.string().min(1).optional(),
        fromEmail: z.string().trim().email().optional(),
        fromName: z.string().trim().min(1).max(255).optional(),
      })
      .optional(),
    branding: z
      .object({
        logoUrl: z.string().trim().url().optional(),
        logoFile: LogoFileSchema.optional(),
      })
      .optional(),
  })
  .default({});

const writeFile = fs.promises.writeFile;
const readFile = fs.promises.readFile;
const mkdir = fs.promises.mkdir;

const applyEnvUpdates = (existing, updates) => {
  const keys = Object.keys(updates).filter((key) => updates[key] !== undefined);
  if (keys.length === 0) {
    return existing;
  }

  if (!existing || existing.trim().length === 0) {
    return `${keys.map((key) => `${key}=${updates[key]}`).join('\n')}\n`;
  }

  const seen = new Set();
  const lines = existing.split(/\r?\n/);
  const updated = lines.map((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!match) {
      return line;
    }
    const key = match[1];
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      seen.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  keys.forEach((key) => {
    if (!seen.has(key)) {
      updated.push(`${key}=${updates[key]}`);
    }
  });

  const filtered = updated.filter((line, index) => line.length > 0 || index !== updated.length - 1).join('\n');
  return filtered.endsWith('\n') ? filtered : `${filtered}\n`;
};

const writeEnvFile = async (envPath, updates) => {
  if (!updates || Object.keys(updates).length === 0) {
    return;
  }

  await mkdir(path.dirname(envPath), { recursive: true });
  const existing = await readFile(envPath, 'utf8').catch(() => '');
  const content = applyEnvUpdates(existing, updates);
  await writeFile(envPath, content, { encoding: 'utf8', mode: 0o600 });
};

const determineExtension = (filename, contentType) => {
  const sanitized = sanitizeFilename(filename || '') || 'logo';
  const inferredFromName = path.extname(sanitized);
  if (inferredFromName) {
    return { base: sanitized.slice(0, -inferredFromName.length) || 'logo', ext: inferredFromName };
  }

  const normalizedType = contentType ? mime.extension(contentType) : null;
  if (normalizedType) {
    return { base: sanitized, ext: `.${normalizedType}` };
  }

  return { base: sanitized, ext: '.png' };
};

const ensureUniqueFilename = (base, ext) => {
  const timestamp = Date.now();
  const safeBase = sanitizeFilename(base || 'logo') || 'logo';
  const safeExt = ext && ext.startsWith('.') ? ext : `.${ext || 'png'}`;
  return sanitizeFilename(`${safeBase}-${timestamp}${safeExt}`) || `${safeBase}-${timestamp}${safeExt}`;
};

const saveLogoFromFile = async (logoFile, uploadsDir) => {
  const { base, ext } = determineExtension(logoFile.filename, logoFile.contentType);
  const filename = ensureUniqueFilename(base || 'logo', ext);
  const buffer = Buffer.from(logoFile.data.replace(/\s+/g, ''), 'base64');
  if (buffer.length === 0) {
    throw new Error('Logo file data is empty.');
  }
  await writeFile(path.join(uploadsDir, filename), buffer, { mode: 0o600 });
  return path.posix.join('/uploads/app', filename);
};

const downloadLogo = async (url, uploadsDir) => {
  const fetchModule = await import('node-fetch');
  const fetch = fetchModule.default || fetchModule;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download logo (HTTP ${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length === 0) {
    throw new Error('Downloaded logo file was empty.');
  }
  const contentType = response.headers.get('content-type') || '';
  let filenameFromUrl = '';
  try {
    const parsedUrl = new URL(url);
    filenameFromUrl = sanitizeFilename(path.basename(parsedUrl.pathname));
  } catch (error) {
    filenameFromUrl = 'logo';
  }
  const { base, ext } = determineExtension(filenameFromUrl || 'logo', contentType);
  const filename = ensureUniqueFilename(base || 'logo', ext);
  await writeFile(path.join(uploadsDir, filename), buffer, { mode: 0o600 });
  return path.posix.join('/uploads/app', filename);
};

const buildEnvUpdates = (config) => {
  const updates = {};
  if (config.smtp?.host) {
    updates.SMTP_HOST = config.smtp.host;
  }
  if (config.smtp?.port) {
    updates.SMTP_PORT = String(config.smtp.port);
  }
  if (config.smtp?.secure !== undefined) {
    updates.SMTP_SECURE = config.smtp.secure ? 'true' : 'false';
  }
  if (config.smtp?.username) {
    updates.SMTP_USER = config.smtp.username;
  }
  if (config.smtp?.password) {
    updates.SMTP_PASS = config.smtp.password;
  }
  if (config.support?.email) {
    updates.SUPPORT_EMAIL = config.support.email;
  }
  return updates;
};

const upsertSetting = async (db, key, value) => {
  const now = new Date();
  const existing = await db('settings').where({ key }).first();
  const payload = { value: JSON.stringify(value), updated_at: now };
  if (existing) {
    await db('settings').where({ key }).update(payload);
  } else {
    await db('settings').insert({ key, value: payload.value, created_at: now, updated_at: now });
  }
};

const applyInstallerConfig = async ({ configPath, backendRoot, db: providedDb } = {}) => {
  if (!configPath) {
    return { skipped: true };
  }

  const resolvedConfigPath = path.resolve(configPath);
  let rawConfig;
  try {
    rawConfig = await readFile(resolvedConfigPath, 'utf8');
  } catch (error) {
    throw new Error(`Installer configuration file not found at ${resolvedConfigPath}`);
  }

  let parsed;
  try {
    parsed = rawConfig ? JSON.parse(rawConfig) : {};
  } catch (error) {
    throw new Error('Installer configuration file contains invalid JSON.');
  }

  const config = InstallerConfigSchema.parse(parsed);
  if (!config || Object.keys(config).length === 0) {
    return { skipped: true };
  }

  const root = backendRoot ? path.resolve(backendRoot) : path.resolve(__dirname, '..');
  const envPath = path.join(root, '.env');
  const uploadsDir = path.join(root, 'uploads', 'app');
  await mkdir(uploadsDir, { recursive: true });

  const envUpdates = buildEnvUpdates(config);
  await writeEnvFile(envPath, envUpdates);

  let logoPath;
  if (config.branding?.logoFile) {
    logoPath = await saveLogoFromFile(config.branding.logoFile, uploadsDir);
  } else if (config.branding?.logoUrl) {
    logoPath = await downloadLogo(config.branding.logoUrl, uploadsDir);
  }

  let dbInstance = providedDb;
  let destroyDb = false;
  if (!dbInstance) {
    // Lazy require to avoid loading database configuration when running tests with a custom connection.
    // eslint-disable-next-line global-require, import/no-dynamic-require
    dbInstance = require(path.join(root, 'src', 'config', 'database'));
    destroyDb = true;
  }

  const hasSettingsTable = await dbInstance.schema.hasTable('settings');
  let appSettings;
  let emailSettings;

  if (hasSettingsTable) {
    const existingApp = await dbInstance('settings').where({ key: 'app_settings' }).first();
    const existingEmail = await dbInstance('settings').where({ key: 'email_settings' }).first();

    const parseSettings = (row) => {
      if (!row || typeof row.value !== 'string') {
        return {};
      }
      try {
        return JSON.parse(row.value) || {};
      } catch (error) {
        return {};
      }
    };

    appSettings = parseSettings(existingApp);
    emailSettings = parseSettings(existingEmail);

    if (config.app?.name) {
      appSettings.appName = config.app.name;
    }
    if (config.support?.email) {
      appSettings.contactEmail = config.support.email;
    }
    if (logoPath) {
      appSettings.logo_url = logoPath;
    }

    const smtpConfig = config.smtp || {};
    if (smtpConfig.host) {
      emailSettings.smtpHost = smtpConfig.host;
    }
    if (smtpConfig.port) {
      emailSettings.smtpPort = smtpConfig.port;
    }
    if (smtpConfig.username) {
      emailSettings.username = smtpConfig.username;
    }
    if (smtpConfig.password) {
      emailSettings.password = smtpConfig.password;
    }
    if (smtpConfig.fromEmail) {
      emailSettings.fromEmail = smtpConfig.fromEmail;
    } else if (config.support?.email) {
      emailSettings.fromEmail = config.support.email;
    }
    if (smtpConfig.fromName) {
      emailSettings.fromName = smtpConfig.fromName;
    } else if (config.app?.name) {
      emailSettings.fromName = config.app.name;
    }
    if (config.support?.email) {
      emailSettings.replyTo = config.support.email;
    }
    emailSettings.method = 'smtp';
    if (smtpConfig.secure === true) {
      emailSettings.encryption = 'SSL';
    } else if (smtpConfig.secure === false) {
      emailSettings.encryption = 'STARTTLS';
    }

    await upsertSetting(dbInstance, 'app_settings', appSettings);
    await upsertSetting(dbInstance, 'email_settings', emailSettings);
  }

  if (destroyDb && dbInstance && typeof dbInstance.destroy === 'function') {
    await dbInstance.destroy();
  }

  return { envPath, envUpdates, logoPath, appSettings, emailSettings };
};

const main = async () => {
  try {
    const configPath = process.argv[2] || process.env.INSTALLER_CONFIG_PATH;
    const backendRoot = process.argv[3];
    const result = await applyInstallerConfig({ configPath, backendRoot });
    if (result.skipped) {
      console.log('No installer configuration provided; skipping app/email setup.');
    } else {
      console.log('Installer configuration applied successfully.');
    }
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { applyInstallerConfig };
