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

  // Provide clearer responses for common database connectivity issues so the
  // frontend (and operators) understand why requests are failing with 500s.
  // When PostgreSQL cannot find a relation it responds with code `42P01`,
  // which typically means migrations were not executed.  Connection issues
  // surface as ECONNREFUSED / ENOTFOUND errors.  Instead of returning a vague
  // 500 we surface an actionable message explaining what to fix.
  const postgresUndefinedTable = err.code === "42P01";
  const connectionErrors = ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]; // DNS
  if (!err.statusCode && (postgresUndefinedTable || connectionErrors.includes(err.code))) {
    status = 503;
    if (postgresUndefinedTable) {
      message =
        "Database schema is missing required tables. Run migrations (npm run migrate) and restart the server.";
    } else {
      message =
        "Unable to reach the database. Verify DATABASE_URL and that the database server is running.";
    }
  }

  if (err instanceof multer.MulterError) {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large';
  }

  if (err.type === 'entity.too.large') {
    status = 413;
    const limit = process.env.DEFAULT_BODY_LIMIT || '25mb';
    message = `Payload too large. Reduce the request body below ${limit} or increase DEFAULT_BODY_LIMIT.`;
  }

  logger.error(`❌ ${status} - ${message}`);

  const payload = { message };
  if (err && typeof err.details === 'object' && err.details !== null) {
    payload.details = err.details;
  }

  res.status(status).json(payload);
};
