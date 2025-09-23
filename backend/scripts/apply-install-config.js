#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const sanitizeFilename = require('sanitize-filename');
const db = require('../src/config/database');
const emailConfigService = require('../src/modules/emailConfig/emailConfig.service');
const appConfigService = require('../src/modules/appConfig/appConfig.service');

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const ensureDir = async (dir) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const escapeEnvValue = (value) => {
  if (value == null) return '';
  const str = String(value);
  if (!str) return '';
  if (/^[A-Za-z0-9_@./:\-]+$/.test(str)) {
    return str;
  }
  return JSON.stringify(str);
};

const upsertEnvValues = async (filePath, updates) => {
  const entries = Object.entries(updates).filter(([, value]) => value != null);
  if (!entries.length) return;

  let existing = '';
  try {
    existing = await fs.promises.readFile(filePath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const lines = existing ? existing.split(/\r?\n/) : [];
  const keys = new Set(entries.map(([key]) => key));
  const filtered = lines.filter((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match) return true;
    return !keys.has(match[1]);
  });

  if (filtered.length && filtered[filtered.length - 1].trim() !== '') {
    filtered.push('');
  }

  for (const [key, value] of entries) {
    filtered.push(`${key}=${escapeEnvValue(value)}`);
  }

  await fs.promises.writeFile(filePath, filtered.join('\n'), 'utf8');
};

const determineExtension = (type, name) => {
  if (typeof name === 'string') {
    const ext = path.extname(name);
    if (ext) return ext;
  }

  switch ((type || '').toLowerCase()) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/svg+xml':
      return '.svg';
    default:
      return '.png';
  }
};

const writeLogoFromBase64 = async (dir, file) => {
  if (!file || typeof file !== 'object') {
    return '';
  }

  const encoding = (file.encoding || 'base64').toLowerCase();
  if (encoding !== 'base64') {
    throw new Error(`Unsupported logo encoding: ${encoding}`);
  }

  const normalizedData = (file.data || '').replace(/\s+/g, '');
  if (!normalizedData) {
    throw new Error('Logo file data is empty.');
  }

  const buffer = Buffer.from(normalizedData, 'base64');
  if (!buffer.length) {
    throw new Error('Decoded logo is empty.');
  }
  if (buffer.length > MAX_LOGO_BYTES) {
    throw new Error('Logo file exceeds 5 MB limit.');
  }

  await ensureDir(dir);

  const extension = determineExtension(file.type, file.name);
  const safeBaseName = sanitizeFilename(file.name || '') || `logo-${Date.now()}`;
  const fileName = safeBaseName.toLowerCase().endsWith(extension.toLowerCase())
    ? safeBaseName
    : `${safeBaseName}${extension}`;
  const targetPath = path.join(dir, fileName);
  await fs.promises.writeFile(targetPath, buffer);
  return `/uploads/app/${fileName}`;
};

const downloadLogoFromUrl = async (sourceUrl, dir) => {
  const client = sourceUrl.startsWith('https:') ? https : http;

  const response = await new Promise((resolve, reject) => {
    const request = client.get(sourceUrl, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`Failed to download logo (HTTP ${res.statusCode})`));
        return;
      }
      resolve(res);
    });
    request.on('error', reject);
  });

  const chunks = [];
  let total = 0;
  await new Promise((resolve, reject) => {
    response.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_LOGO_BYTES) {
        response.destroy();
        reject(new Error('Logo download exceeds 5 MB limit.'));
        return;
      }
      chunks.push(chunk);
    });
    response.on('end', resolve);
    response.on('error', reject);
  });

  const buffer = Buffer.concat(chunks);
  if (!buffer.length) {
    throw new Error('Downloaded logo is empty.');
  }

  await ensureDir(dir);

  const extension = determineExtension(response.headers['content-type'], sourceUrl);
  let baseName = 'logo';
  try {
    const parsedUrl = new URL(sourceUrl);
    baseName = sanitizeFilename(path.basename(parsedUrl.pathname)) || 'logo';
  } catch (_err) {
    // ignore URL parsing failures, fall back to default
  }
  if (!baseName) baseName = 'logo';
  const fileName = baseName.toLowerCase().endsWith(extension.toLowerCase())
    ? baseName
    : `${baseName}${extension}`;
  const targetPath = path.join(dir, fileName);
  await fs.promises.writeFile(targetPath, buffer);
  return `/uploads/app/${fileName}`;
};

const loadLogo = async (config, uploadDir) => {
  if (config.logoFile) {
    return writeLogoFromBase64(uploadDir, config.logoFile);
  }
  if (config.logoUrl) {
    return downloadLogoFromUrl(config.logoUrl, uploadDir);
  }
  return '';
};

const requireValue = (value, message) => {
  if (!value || !value.trim()) {
    throw new Error(message);
  }
  return value.trim();
};

const parsePort = (value) => {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error('SMTP_PORT must be an integer between 1 and 65535.');
  }
  return parsed;
};

const applyConfiguration = async () => {
  const backendRoot = path.resolve(__dirname, '..');
  const envPath = path.join(backendRoot, '.env');
  const uploadDir = path.join(backendRoot, 'uploads', 'app');

  const config = {
    databaseUrl: requireValue(process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL, 'DATABASE_URL is required.'),
    databaseUser: requireValue(process.env.DATABASE_USER || '', 'DATABASE_USER is required.'),
    databasePassword: requireValue(process.env.DATABASE_PASSWORD || '', 'DATABASE_PASSWORD is required.'),
    smtpHost: requireValue(process.env.SMTP_HOST || '', 'SMTP_HOST is required.'),
    smtpPort: parsePort(process.env.SMTP_PORT || ''),
    smtpUser: requireValue(process.env.SMTP_USER || '', 'SMTP_USER is required.'),
    smtpPassword: requireValue(process.env.SMTP_PASS || '', 'SMTP_PASS is required.'),
    defaultFromEmail: requireValue(process.env.DEFAULT_FROM_EMAIL || process.env.SUPPORT_EMAIL || '', 'DEFAULT_FROM_EMAIL is required.'),
    appDisplayName: requireValue(process.env.APP_DISPLAY_NAME || process.env.SMTP_NAME || 'SkillBridge', 'APP_DISPLAY_NAME is required.'),
    logoUrl: (process.env.INSTALL_LOGO_URL || '').trim(),
    logoFile: (() => {
      const data = (process.env.INSTALL_LOGO_FILE_DATA || '').trim();
      if (!data) return null;
      return {
        name: process.env.INSTALL_LOGO_FILE_NAME || '',
        type: process.env.INSTALL_LOGO_FILE_TYPE || '',
        size: Number.parseInt(process.env.INSTALL_LOGO_FILE_SIZE || '0', 10) || 0,
        data,
        encoding: (process.env.INSTALL_LOGO_FILE_ENCODING || 'base64').toLowerCase(),
      };
    })(),
  };

  const envUpdates = {
    DATABASE_URL: config.databaseUrl,
    PRODUCTION_DATABASE_URL: config.databaseUrl,
    DATABASE_USER: config.databaseUser,
    DATABASE_PASSWORD: config.databasePassword,
    SMTP_HOST: config.smtpHost,
    SMTP_PORT: String(config.smtpPort),
    SMTP_USER: config.smtpUser,
    SMTP_PASS: config.smtpPassword,
    SMTP_NAME: config.appDisplayName,
    DEFAULT_FROM_EMAIL: config.defaultFromEmail,
    SUPPORT_EMAIL: config.defaultFromEmail,
    SMTP_SECURE: config.smtpPort === 465 ? 'true' : process.env.SMTP_SECURE || 'false',
    ENABLE_INSTALL: 'false',
    INSTALL_API_ENABLED: 'false',
  };

  await upsertEnvValues(envPath, envUpdates);

  const storedLogoUrl = await loadLogo(config, uploadDir);

  const emailSettings = {
    method: 'smtp',
    fromName: config.appDisplayName,
    fromEmail: config.defaultFromEmail,
    replyTo: config.defaultFromEmail,
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    encryption: config.smtpPort === 465 ? 'SSL' : 'STARTTLS',
    username: config.smtpUser,
    password: config.smtpPassword,
  };
  await emailConfigService.updateSettings(emailSettings);

  const existingAppSettings = await appConfigService.getSettings();
  const appSettings = {
    ...existingAppSettings,
    appName: config.appDisplayName,
    siteTitle: config.appDisplayName,
    contactEmail: config.defaultFromEmail,
  };
  if (storedLogoUrl) {
    appSettings.logo_url = storedLogoUrl;
  }

  await appConfigService.updateSettings(appSettings);

  console.log('✅ Installation configuration applied.');
};

(async () => {
  try {
    await applyConfiguration();
  } catch (error) {
    console.error('Failed to apply installation configuration:', error.message || error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
})();
