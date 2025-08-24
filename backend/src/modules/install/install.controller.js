const { execFile } = require('child_process');
const path = require('path');

exports.checkPrereqs = (req, res) => {
  const script = path.join(__dirname, '../../../../scripts/check_prereqs.sh');
  execFile(script, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) {
      return res.status(500).json({ ok: false, output });
    }
    res.json({ ok: true, output });
  });
};

exports.runInstall = (req, res) => {
  const script = path.join(__dirname, '../../../../install.sh');
  execFile(script, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) {
      return res.status(500).json({ ok: false, output });
    }
    res.json({ ok: true, output });
  });
};
