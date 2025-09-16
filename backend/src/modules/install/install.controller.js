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

  const envOverrides = options.env || {};
  const execOptions = {
    shell: false,
    env: { ...process.env, ...envOverrides },
  };

  execFile(script, execOptions, (error, stdout, stderr) => {
    const rawOutput = stdout + stderr;
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
        return res.status(500).json(parsedOutput);
      }
      return res.status(500).json({ ok: false, output: rawOutput });
    }

    if (parsedOutput && typeof parsedOutput === 'object') {
      return res.json(parsedOutput);
    }

    res.json({ ok: true, output: rawOutput });
  });
};

exports.checkPrereqs = (req, res) =>
  executeScript(res, 'prereqs', {
    expectJson: true,
    evaluateOk: (parsed) => Boolean(parsed && parsed.allPassed),
    determineStatusCode: () => 200,
  });
exports.runInstall = (req, res) =>
  executeScript(res, 'install', {
    env: {
      ADMIN_EMAIL: req.body.adminEmail,
      ADMIN_PASSWORD: req.body.adminPassword,
    },
  });
