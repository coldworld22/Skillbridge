const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// Whitelisted scripts that can be executed via the install API
const SAFE_SCRIPTS = {
  prereqs: path.resolve(__dirname, '../../../../scripts/check_prereqs.sh'),
  install: path.resolve(__dirname, '../../../../install.sh'),
};

const isSafeScript = (key) => {
  const filePath = SAFE_SCRIPTS[key];
  return filePath && fs.existsSync(filePath);
};

exports.checkPrereqs = (req, res) => {
  if (Object.keys(req.query || {}).length > 0) {
    return res.status(400).json({ message: 'No query parameters allowed' });
  }

  if (!isSafeScript('prereqs')) {
    return res.status(500).json({ ok: false, output: 'Script unavailable.' });
  }

  execFile(SAFE_SCRIPTS.prereqs, { timeout: 5 * 60 * 1000 }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) {
      return res.status(500).json({ ok: false, output });
    }
    res.json({ ok: true, output });
  });
};

exports.runInstall = (req, res) => {
  if (Object.keys(req.body || {}).length > 0) {
    return res.status(400).json({ message: 'No request body allowed' });
  }

  if (!isSafeScript('install')) {
    return res.status(500).json({ ok: false, output: 'Script unavailable.' });
  }

  execFile(SAFE_SCRIPTS.install, { timeout: 15 * 60 * 1000 }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) {
      return res.status(500).json({ ok: false, output });
    }
    res.json({ ok: true, output });
  });
};
