// 📁 src/utils/response.js
exports.success = (res, message, data = {}) => res.json({ success: true, message, data });
exports.error = (res, message, status = 500) => res.status(status).json({ success: false, message });