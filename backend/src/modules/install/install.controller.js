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

  return executeScript(res, 'install', {
    env: {
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
    },
  });
};
