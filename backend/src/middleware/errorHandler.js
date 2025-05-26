// 📁 src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`❌ ${status} - ${message}`);
  res.status(status).json({ message });
};
