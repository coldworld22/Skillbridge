const jwt = require("jsonwebtoken");

/**
 * Generate JWT access token
 * @param {Object} payload - The payload to encode in the JWT
 * @returns {string} - The generated JWT access token
 */
exports.generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "60m" });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - The payload to encode in the refresh token
 * @returns {string} - The generated JWT refresh token
 */
exports.generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/**
 * Verify the provided JWT
 * @param {string} token - The token to verify
 * @returns {Object} - The decoded payload if valid
 * @throws {Error} - If the token is invalid or expired
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
