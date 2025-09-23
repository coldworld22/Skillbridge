const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const logger = require('../../utils/logger');
const { refreshAdminPresence, markAdminExists } = require('./install.helpers');

const fsPromises = fs.promises;

// Whitelisted scripts that can be executed via the install API. Paths are
// resolved absolutely and must exist on disk to be executed.
const SAFE_SCRIPTS = {
  prereqs: path.resolve(__dirname, '../../../../scripts/check_prereqs.sh'),
  install: path.resolve(__dirname, '../../../../install.sh'),
};

const executeScript = (res, scriptKey, options = {}) => {
  const script = SAFE_SCRIPTS[scriptKey];
  if (!script || !fs.existsSync(script)) {
    return res.status(400).json({ ok: false, output: 'Invalid script' });
  }

  const envOverrides = options.env || {};
  const mergedEnv = { ...process.env, ...envOverrides };
  const execOptions = { shell: false, env: mergedEnv };
  const evaluateOk =
    typeof options.evaluateOk === 'function' ? options.evaluateOk : null;
  const determineStatusCode =
    typeof options.determineStatusCode === 'function'
      ? options.determineStatusCode
      : null;
  const cleanup = typeof options.cleanup === 'function' ? options.cleanup : null;
  let cleanupInvoked = false;

  const finalize = async () => {
    if (!cleanup || cleanupInvoked) {
      return;
    }
    cleanupInvoked = true;
    try {
      await cleanup();
    } catch (cleanupError) {
      logger.warn('Failed to clean installer resources', cleanupError);
    }
  };

  const resolveStatusCode = ({ ok, parsedOutput, rawOutput, error }) => {
    if (determineStatusCode) {
      try {
        const status = determineStatusCode({ ok, parsedOutput, rawOutput, error });
        if (Number.isInteger(status)) {
          return status;
        }
      } catch (statusError) {
        logger.warn('Failed to determine status code from installer output', statusError);
      }
    }

    if (error) {
      return 500;
    }

    if (ok === false) {
      return 500;
    }

    return 200;
  };

  return execFile(
    script,
    execOptions,
    async (error, stdout = '', stderr = '') => {
      const rawOutput = `${stdout}${stderr}`;
      const trimmedStdout = stdout.trim();
      let parsedOutput;

      if (trimmedStdout) {
        try {
          parsedOutput = JSON.parse(trimmedStdout);
        } catch (_err) {
          parsedOutput = undefined;
        }
      }

      if (error) {
        if (parsedOutput && typeof parsedOutput === 'object') {
          const statusCode = resolveStatusCode({
            ok: false,
            parsedOutput,
            rawOutput,
            error,
          });
          await finalize();
          return res.status(statusCode).json(parsedOutput);
        }

        const statusCode = resolveStatusCode({
          ok: false,
          parsedOutput: undefined,
          rawOutput,
          error,
        });
        await finalize();
        return res.status(statusCode).json({ ok: false, output: rawOutput });
      }

      if (scriptKey === 'install') {
        try {
          markAdminExists();
          await refreshAdminPresence();
        } catch (refreshError) {
          logger.warn(
            'Failed to refresh install guard after successful run',
            refreshError
          );
        }
      }

      if (parsedOutput && typeof parsedOutput === 'object') {
        let ok;
        if (evaluateOk) {
          try {
            ok = Boolean(evaluateOk(parsedOutput));
          } catch (evaluateError) {
            logger.warn('Failed to evaluate installer output', evaluateError);
            ok = undefined;
          }
        }

        const statusCode = resolveStatusCode({
          ok,
          parsedOutput,
          rawOutput,
          error: null,
        });
        await finalize();
        return res.status(statusCode).json(parsedOutput);
      }

      const statusCode = resolveStatusCode({
        ok: true,
        parsedOutput: undefined,
        rawOutput,
        error: null,
      });
      await finalize();
      return res.status(statusCode).json({ ok: true, output: rawOutput });
    }
  );
};

exports.checkPrereqs = (req, res) =>
  executeScript(res, 'prereqs', {
    expectJson: true,
    evaluateOk: (parsed) => Boolean(parsed && parsed.allPassed),
    determineStatusCode: () => 200,
  });
const sanitizeOptionalString = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const sanitized = value.replace(/\0/g, '').replace(/[\r\n]/g, '').trim();
  return sanitized.length > 0 ? sanitized : undefined;
};

const buildInstallerConfig = (body = {}) => {
  const config = {};

  const appName = sanitizeOptionalString(body.appName);
  if (appName) {
    config.app = { name: appName };
  }

  const supportEmail = sanitizeOptionalString(body.supportEmail);
  const supportUrl = sanitizeOptionalString(body.supportUrl);
  if (supportEmail || supportUrl) {
    config.support = {};
    if (supportEmail) {
      config.support.email = supportEmail;
    }
    if (supportUrl) {
      config.support.url = supportUrl;
    }
  }

  const smtp = {};
  const smtpHost = sanitizeOptionalString(body.smtpHost);
  if (smtpHost) {
    smtp.host = smtpHost;
  }

  if (typeof body.smtpPort === 'number' && Number.isInteger(body.smtpPort)) {
    smtp.port = body.smtpPort;
  }

  if (typeof body.smtpSecure === 'boolean') {
    smtp.secure = body.smtpSecure;
  }

  const smtpUser = sanitizeOptionalString(body.smtpUser);
  if (smtpUser) {
    smtp.username = smtpUser;
  }

  const smtpPass = sanitizeOptionalString(body.smtpPass);
  if (smtpPass) {
    smtp.password = smtpPass;
  }

  const smtpFromEmail = sanitizeOptionalString(body.smtpFromEmail);
  if (smtpFromEmail) {
    smtp.fromEmail = smtpFromEmail;
  }

  const smtpFromName = sanitizeOptionalString(body.smtpFromName);
  if (smtpFromName) {
    smtp.fromName = smtpFromName;
  }

  if (Object.keys(smtp).length > 0) {
    config.smtp = smtp;
  }

  const branding = {};
  const logoUrl = sanitizeOptionalString(body.logoUrl);
  if (logoUrl) {
    branding.logoUrl = logoUrl;
  }

  if (body.logoFile && typeof body.logoFile === 'object') {
    const file = body.logoFile;
    const filename = sanitizeOptionalString(file.filename);
    const data = typeof file.data === 'string' ? file.data.replace(/\s+/g, '') : undefined;
    const contentType = sanitizeOptionalString(file.contentType);

    if (filename && data) {
      branding.logoFile = { filename, data };
      if (contentType) {
        branding.logoFile.contentType = contentType;
      }
    }
  }

  if (Object.keys(branding).length > 0) {
    config.branding = branding;
  }

  return config;
};

const persistInstallerConfig = async (config) => {
  const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'skillbridge-install-'));
  const filePath = path.join(tempDir, 'config.json');
  const payload = JSON.stringify(config, null, 2);
  await fsPromises.writeFile(filePath, payload, { encoding: 'utf8', mode: 0o600 });
  return { tempDir, filePath };
};

exports.runInstall = async (req, res) => {
  const sanitizeCredential = (value) => {
    if (typeof value !== 'string') {
      return '';
    }

    return value.replace(/\0/g, '').replace(/[\r\n]/g, '').trim();
  };

  const adminEmail = sanitizeCredential(req.body?.adminEmail);
  const adminPassword = sanitizeCredential(req.body?.adminPassword);

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({
      ok: false,
      message: 'Admin email and password are required.',
    });
  }

  const installerConfig = buildInstallerConfig(req.body);
  const hasAdditionalConfig = Object.keys(installerConfig).length > 0;
  let persistedConfig;

  if (hasAdditionalConfig) {
    try {
      persistedConfig = await persistInstallerConfig(installerConfig);
    } catch (error) {
      logger.error('Failed to persist installer configuration', error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to prepare installer configuration.',
      });
    }
  }

  const env = {
    ADMIN_EMAIL: adminEmail,
    ADMIN_PASSWORD: adminPassword,
  };

  if (persistedConfig) {
    env.INSTALLER_CONFIG_PATH = persistedConfig.filePath;
  }

  return executeScript(res, 'install', {
    env,
    cleanup: persistedConfig
      ? async () => {
          try {
            await fsPromises.rm(persistedConfig.tempDir, { recursive: true, force: true });
          } catch (error) {
            logger.warn('Failed to clean up installer config directory', error);
          }
        }
      : null,
  });
};
