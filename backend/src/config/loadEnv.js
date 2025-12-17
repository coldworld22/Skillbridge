const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ENV_ALREADY_LOADED = Symbol.for('skillbridge.envLoaded');

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function loadEnvironmentFiles() {
  if (global[ENV_ALREADY_LOADED]) {
    return;
  }

  const backendRoot = path.resolve(__dirname, '..', '..');
  const cwdEnv = path.resolve(process.cwd(), '.env');

  const candidates = [
    path.join(backendRoot, '.env.local'),
    path.join(backendRoot, '.env'),
    path.join(backendRoot, '.env.production.local'),
    path.join(backendRoot, '.env.production'),
    cwdEnv,
  ];

  for (const candidate of candidates) {
    if (!candidate || !fileExists(candidate)) {
      continue;
    }
    dotenv.config({ path: candidate, override: false });
  }

  global[ENV_ALREADY_LOADED] = true;
}

loadEnvironmentFiles();
