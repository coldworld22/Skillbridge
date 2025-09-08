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

const allowedScripts = {
  prereqs: path.join(__dirname, '../../../../scripts/check_prereqs.sh'),
  install: path.join(__dirname, '../../../../install.sh'),
};

const executeScript = (res, scriptKey) => {
  const script = allowedScripts[scriptKey];
  if (!script) {
    return res.status(400).json({ ok: false, output: 'Invalid script' });
  }
  execFile(script, { shell: false }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) {
      return res.status(500).json({ ok: false, output });
    }
    res.json({ ok: true, output });
  });
};

exports.checkPrereqs = (req, res) => executeScript(res, 'prereqs');
exports.runInstall = (req, res) => executeScript(res, 'install');
