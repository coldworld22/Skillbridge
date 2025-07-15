// 📁 src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  let origins = process.env.FRONTEND_URL || "http://localhost:3000";
  if (origins.startsWith("FRONTEND_URL=")) origins = origins.replace(/^FRONTEND_URL=/, "");
  const ALLOWED_ORIGINS = origins.split(',').map(o => o.trim());

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  const status =
    typeof err.statusCode === "number"
      ? err.statusCode
      : typeof err.status === "number"
      ? err.status
      : 500;
  const message = err.message || "Internal Server Error";

  console.error(`❌ ${status} - ${message}`);
  res.status(status).json({ message });
};
