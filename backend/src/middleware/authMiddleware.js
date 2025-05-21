// 📁 src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * ✅ Helper: Determines if a role has admin-level access
 */
const isAdminRole = (role) => {
  return ["Admin", "SuperAdmin"].includes(role);
};

/**
 * 🔐 Middleware: Verifies JWT access token
 * - Requires token in the Authorization header
 * - Decodes and attaches `req.user` if valid
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or malformed token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/**
 * 🔐 Middleware: Checks if user has admin or superadmin privileges
 */
exports.isAdmin = (req, res, next) => {
  if (!isAdminRole(req.user.role)) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

/**
 * 🔐 Middleware: Allows access if user is self or has admin/superadmin role
 */
exports.isSelfOrAdmin = (req, res, next) => {
  if (isAdminRole(req.user.role) || req.user.id === req.params.id) {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
};
