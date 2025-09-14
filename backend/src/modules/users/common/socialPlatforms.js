const fs = require('fs');
const path = require('path');

const platformsPath = path.resolve(
  __dirname,
  '../../../../../shared/socialPlatforms.json'
);

if (!fs.existsSync(platformsPath)) {
  throw new Error(`socialPlatforms.json file not found at ${platformsPath}`);
}

let allowedPlatforms;
try {
  allowedPlatforms = require(platformsPath);
  if (!Array.isArray(allowedPlatforms)) {
    throw new Error('socialPlatforms.json must export an array');
  }
} catch (err) {
  throw new Error(`Failed to parse socialPlatforms.json: ${err.message}`);
}

module.exports = { allowedPlatforms };

