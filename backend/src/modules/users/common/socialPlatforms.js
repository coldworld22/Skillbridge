const path = require("path");

const allowedPlatforms = require(path.join(
  __dirname,
  "../../../../shared/socialPlatforms.json"
));

module.exports = { allowedPlatforms };

