let allowedPlatforms;
try {
  allowedPlatforms = require("../../../shared/socialPlatforms.json");
} catch {
  allowedPlatforms = require("../../../../../shared/socialPlatforms.json");
}

module.exports = { allowedPlatforms };
