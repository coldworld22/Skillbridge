const fs = require("fs");
const path = require("path");

const socialPlatformsPath = path.join(
  __dirname,
  "../../../../shared/socialPlatforms.json"
);

if (!fs.existsSync(socialPlatformsPath)) {
  throw new Error("socialPlatforms.json file not found");
}

const allowedPlatforms = require(socialPlatformsPath);

module.exports = { allowedPlatforms };

