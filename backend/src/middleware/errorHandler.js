// 📁 src/middleware/errorHandler.js
const multer = require('multer');

module.exports = (err, req, res, next) => {
  let origins = process.env.FRONTEND_URL || "http://localhost:3000";
  if (origins.startsWith("FRONTEND_URL=")) origins = origins.replace(/^FRONTEND_URL=/, "");
  const ALLOWED_ORIGINS = origins.split(',').map(o => o.trim().replace(/\/$/, ""));

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) && !res.getHeader("Access-Control-Allow-Origin")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  if (!res.getHeader("Access-Control-Allow-Credentials")) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (!res.getHeader("Access-Control-Allow-Methods")) {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  }
  if (!res.getHeader("Access-Control-Allow-Headers")) {
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

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

  console.error(`❌ ${status} - ${message}`);
  res.status(status).json({ message });
};
