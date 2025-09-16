const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// Whitelisted scripts that can be executed via the install API. Paths are
// resolved absolutely and must exist on disk to be executed.
const SAFE_SCRIPTS = {
  prereqs: path.resolve(__dirname, '../../../../scripts/check_prereqs.sh'),
  install: path.resolve(__dirname, '../../../../install.sh'),
};

const tryParseJson = (value) => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};

const combineOutput = (stdout, stderr) => {
  const trimmedStdout = (stdout || '').trim();
  const trimmedStderr = (stderr || '').trim();
  return {
    trimmedStdout,
    trimmedStderr,
    combined: [trimmedStdout, trimmedStderr].filter(Boolean).join('\n'),
  };
};

const executeScript = (res, scriptKey) => {
  const script = SAFE_SCRIPTS[scriptKey];
  if (!script || !fs.existsSync(script)) {
    return res.status(400).json({ ok: false, output: 'Invalid script' });
  }
  execFile(script, { shell: false }, (error, stdout, stderr) => {
    const { trimmedStdout, combined } = combineOutput(stdout, stderr);
    const parsed = tryParseJson(trimmedStdout);

    if (error) {
      if (parsed && typeof parsed === 'object') {
        const statusCode = parsed.ok === false ? 200 : 500;
        return res.status(statusCode).json(parsed);
      }
      return res.status(500).json({ ok: false, output: combined });
    }

    if (parsed && typeof parsed === 'object') {
      return res.json(parsed);
    }

    return res.json({ ok: true, output: combined });
  });
};

exports.checkPrereqs = (req, res) => executeScript(res, 'prereqs');
exports.runInstall = (req, res) => executeScript(res, 'install');
