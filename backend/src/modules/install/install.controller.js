const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');
const { refreshAdminPresence, markAdminExists } = require('./install.helpers');

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
          return res.status(statusCode).json(parsedOutput);
        }

        const statusCode = resolveStatusCode({
          ok: false,
          parsedOutput: undefined,
          rawOutput,
          error,
        });
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
        return res.status(statusCode).json(parsedOutput);
      }

      const statusCode = resolveStatusCode({
        ok: true,
        parsedOutput: undefined,
        rawOutput,
        error: null,
      });
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
exports.runInstall = (req, res) => {
  const sanitizeText = (value) => {
    if (typeof value !== 'string') {
      return '';
    }
    return value.replace(/\0/g, '').replace(/[\r\n]/g, '').trim();
  };

  const sanitizeOptional = (value) => {
    const sanitized = sanitizeText(value);
    return sanitized.length ? sanitized : '';
  };

  const sanitizeFilePayload = (file) => {
    if (!file || typeof file !== 'object') {
      return null;
    }
    const name = sanitizeText(file.name);
    const type = sanitizeOptional(file.type);
    const size = Number.isFinite(file.size) ? Math.max(0, Math.trunc(file.size)) : 0;
    const data = sanitizeText(file.data);
    const encoding = sanitizeOptional(file.encoding);

    if (!name || !data) {
      return null;
    }

    return {
      name,
      type,
      size,
      data,
      encoding: encoding || 'base64',
    };
  };

  const adminEmail = sanitizeText(req.body?.adminEmail);
  const adminPassword = sanitizeText(req.body?.adminPassword);

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({
      ok: false,
      message: 'Admin email and password are required.',
    });
  }

  const config = {
    databaseUrl: sanitizeText(req.body?.databaseUrl),
    databaseUser: sanitizeText(req.body?.databaseUser),
    databasePassword: sanitizeText(req.body?.databasePassword),
    smtpHost: sanitizeText(req.body?.smtpHost),
    smtpPort:
      typeof req.body?.smtpPort === 'number'
        ? req.body.smtpPort
        : Number.parseInt(sanitizeText(req.body?.smtpPort), 10),
    smtpUser: sanitizeText(req.body?.smtpUser),
    smtpPassword: sanitizeText(req.body?.smtpPassword),
    defaultFromEmail: sanitizeText(req.body?.defaultFromEmail),
    appDisplayName: sanitizeText(req.body?.appDisplayName),
    logoUrl: sanitizeOptional(req.body?.logoUrl),
    logoFile: sanitizeFilePayload(req.body?.logoFile),
  };

  const envOverrides = {
    ADMIN_EMAIL: adminEmail,
    ADMIN_PASSWORD: adminPassword,
    DATABASE_URL: config.databaseUrl,
    PRODUCTION_DATABASE_URL: config.databaseUrl,
    DATABASE_USER: config.databaseUser,
    DATABASE_PASSWORD: config.databasePassword,
    SMTP_HOST: config.smtpHost,
    SMTP_PORT: Number.isFinite(config.smtpPort) ? String(config.smtpPort) : undefined,
    SMTP_USER: config.smtpUser,
    SMTP_PASS: config.smtpPassword,
    DEFAULT_FROM_EMAIL: config.defaultFromEmail,
    SUPPORT_EMAIL: config.defaultFromEmail,
    SMTP_NAME: config.appDisplayName,
    APP_DISPLAY_NAME: config.appDisplayName,
    INSTALL_LOGO_URL: config.logoUrl,
    INSTALL_LOGO_FILE_NAME: config.logoFile?.name,
    INSTALL_LOGO_FILE_TYPE: config.logoFile?.type,
    INSTALL_LOGO_FILE_SIZE:
      typeof config.logoFile?.size === 'number' && Number.isFinite(config.logoFile.size)
        ? String(config.logoFile.size)
        : undefined,
    INSTALL_LOGO_FILE_DATA: config.logoFile?.data,
    INSTALL_LOGO_FILE_ENCODING: config.logoFile?.encoding,
  };

  if (Number.isFinite(config.smtpPort) && config.smtpPort > 0) {
    envOverrides.SMTP_PORT = String(config.smtpPort);
    if (config.smtpPort === 465) {
      envOverrides.SMTP_SECURE = 'true';
    }
  }

  if (!envOverrides.SMTP_SECURE && process.env.SMTP_SECURE == null) {
    envOverrides.SMTP_SECURE = 'false';
  }

  const filteredEnv = Object.entries(envOverrides).reduce((acc, [key, value]) => {
    if (value != null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  return executeScript(res, 'install', {
    env: filteredEnv,
  });
};
