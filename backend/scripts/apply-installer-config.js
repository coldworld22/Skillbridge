#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const db = require('../src/config/database');
const emailConfigService = require('../src/modules/emailConfig/emailConfig.service');
const appConfigService = require('../src/modules/appConfig/appConfig.service');

const fsPromises = fs.promises;

const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function resolveBackendRoot(explicitRoot) {
  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }
  if (process.env.INSTALL_BACKEND_ROOT) {
    return path.resolve(process.env.INSTALL_BACKEND_ROOT);
  }
  return path.resolve(__dirname, '..');
}

async function readInstallerConfig(configPath) {
  const candidatePath = configPath || process.env.INSTALL_CONFIG_PATH;
  if (candidatePath) {
    const resolved = path.resolve(candidatePath);
    const raw = await fsPromises.readFile(resolved, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Installer configuration must be a JSON object.');
    }
    return parsed;
  }

  const inline = process.env.INSTALLER_CONFIG_JSON;
  if (!inline) {
    return null;
  }

  const parsed = JSON.parse(inline);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Installer configuration must be a JSON object.');
  }
  return parsed;
}

function formatEnvValue(value) {
  if (value === undefined || value === null) {
    return '';
  }
  const stringValue = String(value);
  if (!stringValue) {
    return '';
  }
  if (/[^A-Za-z0-9_.-]/.test(stringValue)) {
    return JSON.stringify(stringValue);
  }
  return stringValue;
}

async function updateEnvFile(envPath, updates) {
  if (!updates || Object.keys(updates).length === 0) {
    return;
  }

  let current = '';
  if (fs.existsSync(envPath)) {
    current = await fsPromises.readFile(envPath, 'utf8');
  }

  const envMap = {};
  if (current) {
    current.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }
      const [key, ...rest] = line.split('=');
      if (!key) {
        return;
      }
      envMap[key.trim()] = rest.join('=').trim();
    });
  }

  Object.entries(updates).forEach(([key, value]) => {
    envMap[key] = formatEnvValue(value);
  });

  const content = Object.entries(envMap)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fsPromises.mkdir(path.dirname(envPath), { recursive: true });
  await fsPromises.writeFile(envPath, `${content}\n`, 'utf8');
}

function guessExtension({ mimeType, filename } = {}) {
  if (mimeType) {
    const [type, subtype] = mimeType.split('/');
    if (type === 'image' && subtype) {
      return `.${subtype.split(';')[0].trim()}`;
    }
  }
  if (filename && filename.includes('.')) {
    return filename.slice(filename.lastIndexOf('.'));
  }
  return '.png';
}

function decodeLogoData(rawData) {
  if (typeof rawData !== 'string' || rawData.trim().length === 0) {
    throw new Error('Logo data must be a base64 encoded string.');
  }
  const trimmed = rawData.trim();
  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/);
  let mimeType;
  let payload = trimmed;
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1];
    payload = dataUrlMatch[2];
  }
  const normalized = payload.replace(/\s+/g, '');
  if (!BASE64_REGEX.test(normalized)) {
    throw new Error('Logo data must be base64 encoded.');
  }
  const buffer = Buffer.from(normalized, 'base64');
  if (!buffer || buffer.length === 0) {
    throw new Error('Decoded logo data was empty.');
  }
  return { buffer, mimeType };
}

async function downloadLogo(urlString) {
  const resolved = new URL(urlString);
  const client = resolved.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(resolved, (response) => {
      const { statusCode, headers } = response;
      if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
        response.destroy();
        downloadLogo(headers.location).then(resolve).catch(reject);
        return;
      }
      if (statusCode !== 200) {
        response.resume();
        reject(new Error(`Failed to download logo (HTTP ${statusCode})`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        resolve({ buffer: Buffer.concat(chunks), mimeType: headers['content-type'] });
      });
      response.on('error', reject);
    });
    request.on('error', reject);
  });
}

async function ensureLogo(config, backendRoot) {
  const uploadsDir = path.join(backendRoot, 'uploads', 'app');
  await fsPromises.mkdir(uploadsDir, { recursive: true });

  if (config.logoFile) {
    const { buffer, mimeType } = decodeLogoData(config.logoFile.data);
    const ext = guessExtension({ mimeType, filename: config.logoFile.filename });
    const filename = `logo-installer-${Date.now()}${ext}`;
    const absolutePath = path.join(uploadsDir, filename);
    await fsPromises.writeFile(absolutePath, buffer);
    return `/uploads/app/${filename}`;
  }

  if (config.logoUrl) {
    const { buffer, mimeType } = await downloadLogo(config.logoUrl);
    const ext = guessExtension({ mimeType, filename: config.logoUrl });
    const filename = `logo-installer-${Date.now()}${ext}`;
    const absolutePath = path.join(uploadsDir, filename);
    await fsPromises.writeFile(absolutePath, buffer);
    return `/uploads/app/${filename}`;
  }

  return undefined;
}

function buildEmailUpdates(config) {
  if (!config.smtp) {
    return {};
  }
  const updates = {};
  if (config.smtp.host) updates.smtpHost = config.smtp.host;
  if (config.smtp.port) updates.smtpPort = config.smtp.port;
  if (config.smtp.username) updates.username = config.smtp.username;
  if (config.smtp.password) updates.password = config.smtp.password;
  if (config.smtp.fromEmail) updates.fromEmail = config.smtp.fromEmail;
  if (config.smtp.fromName) updates.fromName = config.smtp.fromName;
  if (config.smtp.encryption) updates.encryption = config.smtp.encryption;
  if (typeof config.smtp.secure === 'boolean') {
    updates.secure = config.smtp.secure;
  }
  if (Object.keys(updates).length > 0) {
    updates.method = 'smtp';
    if (!updates.fromName && config.appName) {
      updates.fromName = config.appName;
    }
    if (!updates.fromEmail && config.supportEmail) {
      updates.fromEmail = config.supportEmail;
    }
    if (!updates.replyTo && config.supportEmail) {
      updates.replyTo = config.supportEmail;
    }
  }
  return updates;
}

function buildEnvUpdates(config) {
  const updates = {};
  if (config.appName) updates.APP_NAME = config.appName;
  if (config.supportEmail) updates.SUPPORT_EMAIL = config.supportEmail;
  if (config.codecanyonKey) updates.CODECANYON_SUBSCRIPTION_KEY = config.codecanyonKey;
  if (config.smtp) {
    if (config.smtp.host) updates.SMTP_HOST = config.smtp.host;
    if (config.smtp.port) updates.SMTP_PORT = config.smtp.port;
    if (config.smtp.username) updates.SMTP_USERNAME = config.smtp.username;
    if (config.smtp.password) updates.SMTP_PASSWORD = config.smtp.password;
    if (config.smtp.fromEmail) updates.SMTP_FROM_EMAIL = config.smtp.fromEmail;
    if (config.smtp.fromName) updates.SMTP_FROM_NAME = config.smtp.fromName;
    if (config.smtp.encryption) updates.SMTP_ENCRYPTION = config.smtp.encryption;
    if (typeof config.smtp.secure === 'boolean') {
      updates.SMTP_SECURE = config.smtp.secure ? 'true' : 'false';
    }
  }
  return updates;
}

async function applyInstallerConfig(configPath, options = {}) {
  const backendRoot = resolveBackendRoot(options.backendRoot);
  const config = await readInstallerConfig(configPath);
  if (!config) {
    console.log('No installer configuration detected; skipping extra setup.');
    return;
  }

  const envUpdates = buildEnvUpdates(config);
  const emailUpdates = buildEmailUpdates(config);
  const appUpdates = {};

  if (config.appName) {
    appUpdates.appName = config.appName;
  }
  if (config.supportEmail) {
    appUpdates.contactEmail = config.supportEmail;
  }

  if (config.logoFile || config.logoUrl) {
    appUpdates.logo_url = await ensureLogo(config, backendRoot);
  }

  await updateEnvFile(path.join(backendRoot, '.env'), envUpdates);

  try {
    if (Object.keys(emailUpdates).length > 0) {
      const existingEmail = (await emailConfigService.getSettings()) || {};
      const mergedEmail = { ...existingEmail, ...emailUpdates };
      await emailConfigService.updateSettings(mergedEmail);
    }

    if (Object.keys(appUpdates).length > 0) {
      const existingApp = (await appConfigService.getSettings()) || {};
      const mergedApp = { ...existingApp, ...appUpdates };
      await appConfigService.updateSettings(mergedApp);
    }
  } finally {
    await db.destroy();
  }

  console.log('Installer configuration applied successfully.');
}

module.exports = { applyInstallerConfig };

if (require.main === module) {
  const [, , configPath] = process.argv;
  applyInstallerConfig(configPath)
    .catch((error) => {
      console.error('Failed to apply installer configuration:', error.message || error);
      process.exitCode = 1;
    })
    .then(() => process.exit());
}
