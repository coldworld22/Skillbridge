const logger = require("./logger");

module.exports = (res, error, message, context = {}) => {
  logger.error(message, context, error);
  res.status(500).json({ message });
};
