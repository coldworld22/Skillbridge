// 📁 src/utils/otp.js

/**
 * Generate a numeric OTP of desired length
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - A zero-padded numeric OTP (e.g. "045321")
 */
exports.generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min + "";
};

/**
 * OTP Expiry Helper: Returns expiry timestamp N minutes from now
 * @param {number} minutes - Minutes until OTP expires (default: 10)
 * @returns {Date}
 */
exports.getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
