// 📁 src/middleware/errorHandler.js
const multer = require('multer');
const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  // The CORS middleware defined in `src/server.js` already sets
  // all necessary CORS headers.  Adding them here can result in
  // duplicate `Access-Control-Allow-Origin` values which cause
  // browsers to reject the response.  This error handler simply
  // formats the error response without modifying CORS headers.

  let status =
    typeof err.statusCode === "number"
      ? err.statusCode
      : typeof err.status === "number"
      ? err.status
      : 500;
  let message = err.message || "Internal Server Error";

  if (err instanceof multer.MulterError) {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large';
  }

  if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Payload too large';
  }

  logger.error(`❌ ${status} - ${message}`);
  res.status(status).json({ message });
};
