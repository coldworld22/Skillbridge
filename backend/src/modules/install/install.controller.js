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
  const { parseJson = false } = options;
  const script = SAFE_SCRIPTS[scriptKey];
  if (!script || !fs.existsSync(script)) {
    return res.status(400).json({ ok: false, output: 'Invalid script' });
  }
  execFile(script, { shell: false }, (error, stdout = '', stderr = '') => {
    const output = stdout.toString();
    const errorOutput = stderr.toString();
    if (error) {
      const combined = `${output}${errorOutput}`.trim();
      return res.status(500).json({ ok: false, output: combined });
    }

    if (parseJson) {
      const text = output.trim();
      if (!text) {
        const combined = (output + errorOutput).trim();
        return res.status(500).json({
          ok: false,
          error: 'Installer script returned no JSON output',
          output: combined,
        });
      }
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch (parseError) {
        const combined = (text + errorOutput).trim();
        return res.status(500).json({
          ok: false,
          error: 'Invalid JSON output from script',
          output: combined,
        });
      }
    }

    return res.json({ ok: true, output: `${output}${errorOutput}` });
  });
};

exports.checkPrereqs = (req, res) => executeScript(res, 'prereqs', { parseJson: true });
exports.runInstall = (req, res) => executeScript(res, 'install');
