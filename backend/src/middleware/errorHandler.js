// 📁 src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
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
