const { execFile } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');
const logger = require('../../utils/logger');
const { markAdminExists, refreshAdminPresence } = require('./install.helpers');
const { validatePurchaseCode } = require('../../services/licenseService');
const appConfigService = require('../appConfig/appConfig.service');
const emailConfigService = require('../emailConfig/emailConfig.service');

const execFileAsync = util.promisify(execFile);
const fsPromises = fs.promises;
const candidateScriptRoots = [
  path.resolve(__dirname, '../../../../'),
  path.resolve(__dirname, '../../../'),
  process.cwd(),
];

const resolveInstallerAsset = (relativePath) => {
  for (const rootDir of candidateScriptRoots) {
    const candidate = path.resolve(rootDir, relativePath);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.resolve(__dirname, '../../../../', relativePath);
};

const SCRIPTS = {
  prereqs: () => resolveInstallerAsset('scripts/check_prereqs.sh'),
  install: () => resolveInstallerAsset('install.sh'),
};

const runScript = async (scriptKey, { env = {}, args = [] } = {}) => {
  const scriptResolver = SCRIPTS[scriptKey];
  const scriptPath = typeof scriptResolver === 'function' ? scriptResolver() : scriptResolver;
  if (!scriptPath) {
    const error = new Error(`Installer script not found for key "${scriptKey}".`);
    error.code = 'SCRIPT_NOT_FOUND';
    error.scriptKey = scriptKey;
    throw error;
  }
  if (!fs.existsSync(scriptPath)) {
    const error = new Error(`Installer script not found: ${scriptPath}`);
    error.code = 'ENOENT';
    error.installScriptKey = scriptKey;
    error.installScriptPath = scriptPath;
    throw error;
  }
  const mergedEnv = { ...process.env, ...env };
  try {
    return await execFileAsync(scriptPath, args, { env: mergedEnv, shell: false });
  } catch (error) {
    error.installScriptKey = scriptKey;
    error.installScriptPath = scriptPath;
    throw error;
  }
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
    if (error?.code === 'SCRIPT_NOT_FOUND') {
      logger.error('Prerequisite script is missing', error);
      return res.status(500).json({
        ok: false,
        message: 'Prerequisite checker is unavailable. Contact the system administrator.',
      });
    }
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    logger.error('Prerequisite check failed', error);
    if (error?.code === 'ENOENT') {
      const scriptPath = error.installScriptPath || error.path || 'installer script';
      return res.status(500).json({
        ok: false,
        code: 'INSTALLER_SCRIPT_MISSING',
        message: [
          'Unable to execute prerequisite checker.',
          `Ensure ${scriptPath} exists and that Bash is available in the environment.`,
        ].join(' '),
      });
    }
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

const extractDomainFromRequest = (req) => {
  const forwardedHost = (req.get('x-forwarded-host') || '').split(',')[0].trim();
  if (forwardedHost) {
    return forwardedHost.split(':')[0];
  }
  const hostHeader = (req.get('host') || '').trim();
  if (hostHeader) {
    return hostHeader.split(':')[0];
  }
  return req.hostname;
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

  if (codecanyonKey) {
    try {
      const domain = extractDomainFromRequest(req);
      const { valid, message } = await validatePurchaseCode(codecanyonKey, domain);
      if (!valid) {
        if (uploadedLogoAbsolute) {
          await removeFileIfExists(uploadedLogoAbsolute);
        }
        return res.status(400).json({
          ok: false,
          message: message || 'Codecanyon purchase code could not be verified.',
          fieldErrors: {
            codecanyonKey: message || 'Codecanyon purchase code could not be verified.',
          },
        });
      }
    } catch (error) {
      logger.error('Codecanyon license validation failed during install', error);
      if (uploadedLogoAbsolute) {
        await removeFileIfExists(uploadedLogoAbsolute);
      }
      return res.status(500).json({
        ok: false,
        message: 'Unexpected error while validating the Codecanyon purchase code. Please try again.',
      });
    }
  }

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
    if (error?.code === 'SCRIPT_NOT_FOUND') {
      logger.error('Installation script is missing', error);
      await cleanupTempConfig();
      if (uploadedLogoAbsolute) {
        await removeFileIfExists(uploadedLogoAbsolute);
      }
      return res.status(500).json({
        ok: false,
        message: 'Installation script is unavailable. Contact the system administrator.',
      });
    }
    logger.error('Installation failed', error);
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    await cleanupTempConfig();
    if (uploadedLogoAbsolute) {
      await removeFileIfExists(uploadedLogoAbsolute);
    }
    if (error?.code === 'ENOENT') {
      const scriptPath = error.installScriptPath || error.path || 'installer script';
      return res.status(500).json({
        ok: false,
        code: 'INSTALLER_SCRIPT_MISSING',
        message: [
          'Unable to execute installer script.',
          `Ensure ${scriptPath} exists and that Bash is available in the environment.`,
        ].join(' '),
      });
    }
    const payload = parseInstallerOutput(stdout, stderr);
    payload.ok = false;
    return res.status(500).json(payload);
  }
};
