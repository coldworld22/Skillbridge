const { exec } = require('child_process');
const path = require('path');

exports.checkPrereqs = (req, res) => {
  const script = path.join(__dirname, '../../../../scripts/check_prereqs.sh');
  exec(script, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) {
      return res.status(500).json({ ok: false, output });
    }
    res.json({ ok: true, output });
  });
};

exports.runInstall = (req, res) => {
  const script = path.join(__dirname, '../../../../install.sh');
  exec(script, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) {
      return res.status(500).json({ ok: false, output });
    }
    res.json({ ok: true, output });
  });
};
