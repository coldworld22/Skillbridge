const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// Whitelisted scripts that can be executed via the install API. Paths are
// resolved absolutely and must exist on disk to be executed.
const SAFE_SCRIPTS = {
  prereqs: path.resolve(__dirname, '../../../../scripts/check_prereqs.sh'),
  install: path.resolve(__dirname, '../../../../install.sh'),
};

const executeScript = (res, scriptKey, args = []) => {
  const script = SAFE_SCRIPTS[scriptKey];
  if (!script || !fs.existsSync(script)) {
    return res.status(400).json({ ok: false, output: 'Invalid script' });
  }
  execFile(script, args, { shell: false }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) {
      return res.status(500).json({ ok: false, output });
    }
    res.json({ ok: true, output });
  });
};

exports.checkPrereqs = (req, res) => executeScript(res, 'prereqs');
exports.runInstall = (req, res) => {
  const { mode, domain } = req.body || {};
  const args = [];
  if (mode) {
    args.push(mode);
    if (mode === 'production' && domain) {
      args.push(domain);
    }
  }
  return executeScript(res, 'install', args);
};
