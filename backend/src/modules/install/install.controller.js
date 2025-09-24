const { execFile } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');
const logger = require('../../utils/logger');
const { markAdminExists, refreshAdminPresence } = require('./install.helpers');
const appConfigService = require('../appConfig/appConfig.service');
const emailConfigService = require('../emailConfig/emailConfig.service');
const { validatePurchaseCode } = require('../../services/licenseService');

const execFileAsync = util.promisify(execFile);
const fsPromises = fs.promises;

const SCRIPTS = {
  prereqs: path.resolve(__dirname, '../../../../scripts/check_prereqs.sh'),
  install: path.resolve(__dirname, '../../../../install.sh'),
};

const runScript = async (scriptKey, { env = {}, args = [] } = {}) => {
  const scriptPath = SCRIPTS[scriptKey];
  if (!scriptPath) {
    throw new Error(`Unknown installer script: ${scriptKey}`);
  }
  const mergedEnv = { ...process.env, ...env };
  return execFileAsync(scriptPath, args, { env: mergedEnv, shell: false });
};

const parseInstallerOutput = (stdout, stderr) => {
  const trimmed = (stdout || '').trim();
  if (trimmed) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (_err) {
      // fall through to raw output
    }
  }
  const combined = `${stdout || ''}${stderr || ''}`.trim();
  return { ok: false, output: combined };
};

exports.checkPrereqs = async (req, res, next) => {
  try {
    const { stdout, stderr } = await runScript('prereqs');
    const parsed = parseInstallerOutput(stdout, stderr);
    const ok = typeof parsed.ok === 'boolean' ? parsed.ok : Boolean(parsed.allPassed);
    return res.status(200).json({ ...parsed, ok });
  } catch (error) {
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    logger.error('Prerequisite check failed', error);
    const payload = parseInstallerOutput(stdout, stderr);
    return res.status(500).json(payload);
  }
};

const buildInstallerConfig = (body) => {
  const config = {
    adminEmail: body.adminEmail,
    adminPassword: body.adminPassword,
    appName: body.appName,
    supportEmail: body.supportEmail,
    smtp: {
      host: body.smtpHost,
      port: body.smtpPort,
      username: body.smtpUsername,
      password: body.smtpPassword,
      secure: Boolean(body.smtpSecure),
      fromEmail: body.smtpFromEmail || body.supportEmail,
      fromName: body.smtpFromName || body.appName,
    },
  };

  if (body.logoUrl) {
    config.logoUrl = body.logoUrl;
  }

  if (body.codecanyonKey) {
    config.codecanyonKey = body.codecanyonKey;
  }

  return config;
};

const removeFileIfExists = async (filePath) => {
  if (!filePath) return;
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      logger.warn('Failed to remove file during installer cleanup', error);
    }
  }
};

exports.runInstall = async (req, res) => {
  const {
    adminEmail,
    adminPassword,
    appName,
    supportEmail,
    smtpHost,
    smtpPort,
    smtpUsername,
    smtpPassword,
    smtpSecure,
    smtpFromEmail,
    smtpFromName,
    logoUrl,
    codecanyonKey,
  } = req.body;

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({ ok: false, message: 'Admin email and password are required.' });
  }

  if (codecanyonKey) {
    try {
      const forwardedHost = (req.get('x-forwarded-host') || '').split(',')[0]?.trim();
      const hostHeader = (req.get('host') || '').trim();
      const domain = forwardedHost || hostHeader || req.hostname;
      const licenseResult = await validatePurchaseCode(codecanyonKey, domain);
      if (!licenseResult?.valid) {
        const message = licenseResult?.message || 'Codecanyon license verification failed.';
        const statusCode = /unable to verify/i.test(message) ? 502 : 400;
        logger.warn('Codecanyon license verification rejected during install', { message });
        return res.status(statusCode).json({ ok: false, message });
      }
    } catch (error) {
      logger.error('Codecanyon license verification error during install', error);
      return res
        .status(502)
        .json({ ok: false, message: 'Unable to verify Codecanyon license key. Please try again later.' });
    }
  }

  const uploadedLogoRelative = req.file ? `/uploads/app/${req.file.filename}` : undefined;
  const uploadedLogoAbsolute = req.file ? req.file.path : undefined;

  let tempDir;
  let configPath;
  try {
    tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'skillbridge-install-'));
    configPath = path.join(tempDir, 'installer-config.json');
    const configPayload = buildInstallerConfig(req.body);
    await fsPromises.writeFile(configPath, JSON.stringify(configPayload), 'utf8');
  } catch (error) {
    logger.error('Failed to prepare installer configuration', error);
    if (tempDir) {
      try {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.warn('Failed to remove temporary installer directory', cleanupError);
      }
    }
    return res.status(500).json({ ok: false, message: 'Failed to prepare installer configuration.' });
  }

  const cleanupTempConfig = async () => {
    if (configPath) {
      await removeFileIfExists(configPath);
    }
    if (tempDir) {
      try {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          logger.warn('Failed to remove installer temp directory', error);
        }
      }
    }
  };

  try {
    const env = {
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      INSTALL_CONFIG_PATH: configPath,
      START_DEV_SERVICES: 'false',
      MODE: process.env.MODE || 'development',
    };

    if (codecanyonKey) {
      env.CODECANYON_SUBSCRIPTION_KEY = codecanyonKey;
    }

    const { stdout, stderr } = await runScript('install', { env });
    markAdminExists();
    await refreshAdminPresence().catch((error) => {
      logger.warn('Failed to refresh admin presence cache after install', error);
    });

    const existingAppSettings = (await appConfigService.getSettings()) || {};
    const previousLogoUrl = existingAppSettings.logo_url;
    const nextAppSettings = { ...existingAppSettings };
    if (appName) {
      nextAppSettings.appName = appName;
      if (!nextAppSettings.siteTitle) {
        nextAppSettings.siteTitle = appName;
      }
    }
    if (supportEmail) {
      nextAppSettings.contactEmail = supportEmail;
      nextAppSettings.supportEmail = supportEmail;
    }
    if (uploadedLogoRelative) {
      nextAppSettings.logo_url = uploadedLogoRelative;
    } else if (logoUrl) {
      nextAppSettings.logo_url = logoUrl;
    }
    await appConfigService.updateSettings(nextAppSettings);
    const newLogoUrl = nextAppSettings.logo_url;
    const storedLogoChanged =
      typeof previousLogoUrl === 'string' &&
      previousLogoUrl.length > 0 &&
      previousLogoUrl !== newLogoUrl;
    if (storedLogoChanged && previousLogoUrl.startsWith('/uploads/app/')) {
      const sanitizedPreviousLogoPath = previousLogoUrl.replace(/^\/+/, '');
      const previousLogoAbsolute = path.join(
        __dirname,
        '../../../',
        sanitizedPreviousLogoPath
      );
      await removeFileIfExists(previousLogoAbsolute);
    }

    const existingEmailSettings = (await emailConfigService.getSettings()) || {};
    const nextEmailSettings = {
      ...existingEmailSettings,
      method: 'smtp',
      smtpHost,
      smtpPort,
      username: smtpUsername,
      password: smtpPassword,
      secure: Boolean(smtpSecure),
      fromEmail: smtpFromEmail || supportEmail || existingEmailSettings.fromEmail,
      fromName: smtpFromName || appName || existingEmailSettings.fromName,
    };
    if (supportEmail) {
      nextEmailSettings.replyTo = supportEmail;
    }
    if (Boolean(smtpSecure)) {
      nextEmailSettings.encryption = 'SSL';
    } else {
      nextEmailSettings.encryption = 'TLS';
    }
    await emailConfigService.updateSettings(nextEmailSettings);

    const parsed = parseInstallerOutput(stdout, stderr);
    const ok = typeof parsed.ok === 'boolean' ? parsed.ok : true;
    await cleanupTempConfig();
    return res.status(ok ? 200 : 500).json({ ...parsed, ok });
  } catch (error) {
    logger.error('Installation failed', error);
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    await cleanupTempConfig();
    if (uploadedLogoAbsolute) {
      await removeFileIfExists(uploadedLogoAbsolute);
    }
    const payload = parseInstallerOutput(stdout, stderr);
    payload.ok = false;
    return res.status(500).json(payload);
  }
};
