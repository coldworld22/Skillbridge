const { verifyToken, isAdmin } = require('./auth/authMiddleware');

// Combines token verification and admin role check
module.exports = [verifyToken, isAdmin];
