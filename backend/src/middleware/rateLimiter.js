// 📁 src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

exports.limitAuthRequests = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many attempts. Please try again later.",
});
