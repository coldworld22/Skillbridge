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
  const onComplete =
    typeof options.onComplete === 'function' ? options.onComplete : null;

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

      const runCompletion = async (details = {}) => {
        if (!onComplete) return;
        try {
          await onComplete({ rawOutput, ...details });
        } catch (completionError) {
          logger.warn(
            'Failed to run installer completion handler',
            completionError
          );
        }
      };

      if (error) {
        if (parsedOutput && typeof parsedOutput === 'object') {
          const statusCode = resolveStatusCode({
            ok: false,
            parsedOutput,
            rawOutput,
            error,
          });
          await runCompletion({ error, parsedOutput });
          return res.status(statusCode).json(parsedOutput);
        }

        const statusCode = resolveStatusCode({
          ok: false,
          parsedOutput: undefined,
          rawOutput,
          error,
        });
        await runCompletion({ error });
        return res
          .status(statusCode)
          .json({ ok: false, output: rawOutput });
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
        await runCompletion({ parsedOutput });
        return res.status(statusCode).json(parsedOutput);
      }

      const statusCode = resolveStatusCode({
        ok: true,
        parsedOutput: undefined,
        rawOutput,
        error: null,
      });
      await runCompletion();
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
const sanitizeValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/\0/g, '').replace(/[\r\n]/g, '').trim();
};

const buildLogoFilePayload = (logoFile = {}) => {
  if (!logoFile || typeof logoFile !== 'object') {
    return undefined;
  }

  const { data, filename, mimeType } = logoFile;
  if (typeof data !== 'string' || data.trim().length === 0) {
    return undefined;
  }

  const payload = { data: sanitizeValue(data) };
  const safeFilename = sanitizeValue(filename);
  if (safeFilename) {
    payload.filename = safeFilename;
  }
  const safeMimeType = sanitizeValue(mimeType);
  if (safeMimeType) {
    payload.mimeType = safeMimeType;
  }
  return payload;
};

exports.runInstall = async (req, res) => {
  const sanitizeCredential = (value) => {
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
  const installerConfig = {
    adminEmail,
    adminPassword,
  };

  const assignIfPresent = (target, key, value, transform) => {
    const sanitized = sanitizeValue(value);
    const transformed = typeof transform === 'function' ? transform(sanitized) : sanitized;
    if (transformed !== undefined && transformed !== null && transformed !== '') {
      target[key] = transformed;
    }
  };

  assignIfPresent(installerConfig, 'supportEmail', req.body?.supportEmail);
  assignIfPresent(installerConfig, 'appName', req.body?.appName);

  const logoFilePayload = buildLogoFilePayload(req.body?.logoFile);
  if (logoFilePayload) {
    installerConfig.logoFile = logoFilePayload;
  }
  const logoUrl = sanitizeValue(req.body?.logoUrl);
  if (logoUrl) {
    installerConfig.logoUrl = logoUrl;
  }

  const smtpConfig = {};
  assignIfPresent(smtpConfig, 'host', req.body?.smtpHost);
  const smtpPortValue = req.body?.smtpPort;
  if (smtpPortValue !== undefined && smtpPortValue !== null && smtpPortValue !== '') {
    const numericPort = Number(smtpPortValue);
    if (Number.isFinite(numericPort)) {
      smtpConfig.port = numericPort;
    }
  }
  assignIfPresent(smtpConfig, 'username', req.body?.smtpUsername);
  assignIfPresent(smtpConfig, 'password', req.body?.smtpPassword);
  assignIfPresent(smtpConfig, 'fromEmail', req.body?.smtpFromEmail);
  assignIfPresent(smtpConfig, 'fromName', req.body?.smtpFromName);
  assignIfPresent(smtpConfig, 'encryption', req.body?.smtpEncryption);
  const smtpSecureValue = req.body?.smtpSecure;
  if (typeof smtpSecureValue === 'boolean') {
    smtpConfig.secure = smtpSecureValue;
  }

  if (Object.keys(smtpConfig).length > 0) {
    installerConfig.smtp = smtpConfig;
  }

  let tempDir;
  let configPath;
  try {
    tempDir = await fsPromises.mkdtemp(
      path.join(os.tmpdir(), 'skillbridge-install-')
    );
    configPath = path.join(tempDir, 'installer-config.json');
    await fsPromises.writeFile(
      configPath,
      JSON.stringify(installerConfig),
      'utf8'
    );
  } catch (error) {
    logger.error('Failed to prepare installer configuration', error);
    if (tempDir) {
      try {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.warn('Failed to clean up installer config directory', cleanupError);
      }
    }
    return res.status(500).json({
      ok: false,
      message: 'Failed to prepare installer configuration.',
    });
  }

  const cleanup = async () => {
    if (!configPath) return;
    try {
      await fsPromises.unlink(configPath);
    } catch (unlinkError) {
      if (unlinkError?.code !== 'ENOENT') {
        logger.warn('Failed to remove installer config file', unlinkError);
      }
    }
    if (tempDir) {
      try {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      } catch (dirError) {
        if (dirError?.code !== 'ENOENT') {
          logger.warn('Failed to remove installer config directory', dirError);
        }
      }
    }
  };

  return executeScript(res, 'install', {
    env: {
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      INSTALL_CONFIG_PATH: configPath,
    },
    onComplete: cleanup,
  });
};
