const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

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

  execFile(script, { shell: false }, (error, stdout, stderr) => {
    const trimmedStdout = stdout ? stdout.trim() : '';
    const trimmedStderr = stderr ? stderr.trim() : '';

    if (options.expectJson) {
      const rawForParsing = trimmedStdout || trimmedStderr;
      if (rawForParsing) {
        try {
          const parsed = JSON.parse(trimmedStdout || rawForParsing);
          const ok = options.evaluateOk ? options.evaluateOk(parsed, error) : !error;
          const statusCode = options.determineStatusCode
            ? options.determineStatusCode(ok, error)
            : error && ok
              ? 500
              : 200;
          return res.status(statusCode).json({ ok, output: parsed });
        } catch (parseError) {
          const fallback = rawForParsing || (error ? error.message : '');
          return res.status(500).json({ ok: false, output: fallback || 'Invalid JSON output.' });
        }
      }

      return res.status(500).json({ ok: false, output: 'No output received from script.' });
    }

    const output = (stdout + stderr).trim();
    if (error) {
      return res.status(500).json({ ok: false, output: output || error.message });
    }
    res.json({ ok: true, output });
  });
};

exports.checkPrereqs = (req, res) =>
  executeScript(res, 'prereqs', {
    expectJson: true,
    evaluateOk: (parsed) => Boolean(parsed && parsed.allPassed),
    determineStatusCode: () => 200,
  });
exports.runInstall = (req, res) => executeScript(res, 'install');
