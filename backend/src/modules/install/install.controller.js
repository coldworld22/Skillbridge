const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const PREREQ_FILENAME = 'check_prereqs.sh';
const INSTALL_FILENAME = 'install.sh';

const uniquePaths = (candidates = []) => {
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (!candidate) return false;
    const normalized = path.resolve(candidate);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const buildScriptCandidates = (scriptKey) => {
  const overridePath =
    scriptKey === 'prereqs'
      ? process.env.INSTALL_PREREQS_PATH
      : process.env.INSTALL_RUNNER_PATH;
  const sharedDir = process.env.INSTALL_SCRIPTS_DIR;
  const filename =
    scriptKey === 'prereqs' ? PREREQ_FILENAME : INSTALL_FILENAME;

  const directOverrides = [
    overridePath,
    sharedDir ? path.join(sharedDir, filename) : null,
  ];

  const repoRelative = [
    path.join(__dirname, '../../../../scripts', filename),
    path.join(__dirname, '../../../scripts', filename),
    path.join(__dirname, '../../../../../scripts', filename),
    path.join(__dirname, '../../../../', filename),
    path.join(__dirname, '../../../', filename),
    path.join(__dirname, '../../../../../', filename),
  ];

  const cwdRelative = [
    path.join(process.cwd(), 'scripts', filename),
    path.join(process.cwd(), filename),
    path.join(process.cwd(), '../scripts', filename),
    path.join(process.cwd(), `../${filename}`),
  ];

  return uniquePaths([...directOverrides, ...repoRelative, ...cwdRelative]);
};

const resolveScript = (scriptKey) => {
  const candidates = buildScriptCandidates(scriptKey);
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (error) {
      console.warn?.('Unable to access installer script candidate', {
        scriptKey,
        path: candidate,
        error: error.message,
      });
    }
  }
  return null;
};

const parsePrereqOutput = (rawOutput = '') => {
  const results = [];
  const logs = [];
  let summary = null;

  rawOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith('RESULT|')) {
        const [, status = 'fail', label = 'Unknown', detail = ''] =
          line.split('|');
        results.push({
          status: status === 'ok' ? 'ok' : 'fail',
          label,
          detail,
        });
      } else if (line.startsWith('SUMMARY|')) {
        // eslint-disable-next-line prefer-destructuring
        summary = line.split('|')[1];
      } else {
        logs.push(line);
      }
    });

  const ok =
    summary === 'ok' ||
    (summary === null && results.every((result) => result.status === 'ok'));

  return {
    ok,
    results,
    logs,
  };
};

const executeScript = (res, scriptKey, args = []) => {
  const script = resolveScript(scriptKey);
  if (!script) {
    return res.status(400).json({ ok: false, output: 'Invalid script' });
  }
  execFile(script, args, { shell: false }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (scriptKey === 'prereqs') {
      const parsed = parsePrereqOutput(output);
      const statusCode = parsed.ok ? 200 : 200;
      return res.status(statusCode).json({
        ok: parsed.ok,
        output,
        results: parsed.results,
        logs: parsed.logs,
      });
    }
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
