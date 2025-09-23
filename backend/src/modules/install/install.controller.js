const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');
const { refreshAdminPresence, markAdminExists } = require('./install.helpers');
const appConfigService = require('../appConfig/appConfig.service');
const emailConfigService = require('../emailConfig/emailConfig.service');

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
  const afterSuccess =
    typeof options.afterSuccess === 'function' ? options.afterSuccess : null;

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

  const runFinalizeHook = async ({ parsedOutput, rawOutput, statusCode }) => {
    if (!afterSuccess || statusCode >= 400) {
      return;
    }

    await afterSuccess({ parsedOutput, rawOutput, statusCode, scriptKey });
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

        if (afterSuccess) {
          try {
            await runFinalizeHook({ parsedOutput, rawOutput, statusCode });
          } catch (hookError) {
            logger.error('Failed to finalize installation', hookError);
            return res.status(500).json({
              ok: false,
              message:
                'Installation completed but failed to finalize configuration. Check the server logs and try again.',
            });
          }
        }

        return res.status(statusCode).json(parsedOutput);
      }

      const statusCode = resolveStatusCode({
        ok: true,
        parsedOutput: undefined,
        rawOutput,
        error: null,
      });

      if (afterSuccess) {
        try {
          await runFinalizeHook({ parsedOutput: undefined, rawOutput, statusCode });
        } catch (hookError) {
          logger.error('Failed to finalize installation', hookError);
          return res.status(500).json({
            ok: false,
            message:
              'Installation completed but failed to finalize configuration. Check the server logs and try again.',
          });
        }
      }

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
  const sanitizeCredential = (value) => {
    if (typeof value !== 'string') {
      return '';
    }

    return value.replace(/\0/g, '').replace(/[\r\n]/g, '').trim();
  };

  const sanitizeText = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\0/g, '').replace(/[\r\n]+/g, ' ').trim();
  };

  const adminEmail = sanitizeCredential(req.body?.adminEmail);
  const adminPassword = sanitizeCredential(req.body?.adminPassword);
  const appName = sanitizeText(req.body?.appName);
  const supportEmail = sanitizeCredential(req.body?.supportEmail);
  const logoUrlRaw = typeof req.body?.logoUrl === 'string' ? req.body.logoUrl.trim() : '';
  const logoUrl = logoUrlRaw.length > 0 ? logoUrlRaw : undefined;

  const uploadedLogoRelative = req.file?.filename
    ? `/uploads/app/${req.file.filename}`
    : undefined;
  const uploadedLogoAbsolute = req.file?.filename
    ? path.join(__dirname, '../../../uploads/app', req.file.filename)
    : undefined;

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({
      ok: false,
      message: 'Admin email and password are required.',
    });
  }

  const removeFileIfExists = async (filePath) => {
    if (!filePath) return;
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn('Failed to remove uploaded logo during install cleanup', error);
      }
    }
  };

  return executeScript(res, 'install', {
    env: {
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
    },
    afterSuccess: async () => {
      const existingAppSettings = (await appConfigService.getSettings()) || {};
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

      let oldLogoToRemove;

      if (uploadedLogoRelative) {
        if (
          existingAppSettings.logo_url &&
          existingAppSettings.logo_url !== uploadedLogoRelative &&
          existingAppSettings.logo_url.startsWith('/uploads/app/')
        ) {
          oldLogoToRemove = path.join(
            __dirname,
            '../../../',
            existingAppSettings.logo_url.replace(/^\/+/, '')
          );
        }
        nextAppSettings.logo_url = uploadedLogoRelative;
      } else if (logoUrl) {
        if (
          existingAppSettings.logo_url &&
          existingAppSettings.logo_url.startsWith('/uploads/app/') &&
          !logoUrl.startsWith('/uploads/app/')
        ) {
          oldLogoToRemove = path.join(
            __dirname,
            '../../../',
            existingAppSettings.logo_url.replace(/^\/+/, '')
          );
        }
        nextAppSettings.logo_url = logoUrl;
      }

      try {
        await appConfigService.updateSettings(nextAppSettings);
        if (oldLogoToRemove && oldLogoToRemove !== uploadedLogoAbsolute) {
          await removeFileIfExists(oldLogoToRemove);
        }
      } catch (error) {
        if (uploadedLogoAbsolute) {
          await removeFileIfExists(uploadedLogoAbsolute);
        }
        throw error;
      }

      const existingEmailSettings = (await emailConfigService.getSettings()) || {};
      const updatedEmailSettings = { ...existingEmailSettings };

      if (appName) {
        updatedEmailSettings.fromName = appName;
      }

      if (supportEmail) {
        updatedEmailSettings.fromEmail = supportEmail;
        updatedEmailSettings.replyTo = supportEmail;
      }

      try {
        await emailConfigService.updateSettings(updatedEmailSettings);
      } catch (error) {
        if (uploadedLogoAbsolute && uploadedLogoRelative) {
          await removeFileIfExists(uploadedLogoAbsolute);
        }
        throw error;
      }
    },
  });
};
