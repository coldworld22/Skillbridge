// 📁 src/middleware/auth/authMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * ✅ Helper: Determines if a role has admin-level access
 */
const isAdminRole = (role = "") => {
  return ["admin", "superadmin"].includes(role.toLowerCase());
};


/**
 * 🔐 Middleware: Verifies JWT access token
 * - Requires token in the Authorization header
 * - Decodes and attaches `req.user` if valid
 */
const verifyToken = (req, res, next) => {
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
 * 🔐 Middleware: Restrict access to Admin and SuperAdmin roles
 */
const isAdmin = (req, res, next) => {
  if (!req.user || !isAdminRole(req.user.role)) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

/**
 * 🔐 Middleware: Restrict access to SuperAdmin only
 */
const isSuperAdmin = (req, res, next) => {
  if (req.user?.role === "SuperAdmin") {
    return next();
  }
  return res.status(403).json({ message: "SuperAdmin access only" });
};

/**
 * 🔐 Middleware: Restrict access to Instructor only
 */
const isInstructor = (req, res, next) => {
  if (req.user?.role === "Instructor") {
    return next();
  }
  return res.status(403).json({ message: "Instructor access only" });
};

/**
 * 🔐 Middleware: Allow Instructor or Admin roles
 */
const isInstructorOrAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role === "Instructor" || isAdminRole(role)) {
    return next();
  }
  return res.status(403).json({ message: "Instructor or Admin access only" });
};

/**
 * 🔐 Middleware: Restrict access to Student only
 */
const isStudent = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role === "student") return next();
  return res.status(403).json({ message: "Access denied. Students only." });
};

/**
 * 🔐 Middleware: Allows access if user is self or has admin/superadmin role
 */
const isSelfOrAdmin = (req, res, next) => {
  if (isAdminRole(req.user.role) || req.user.id === req.params.id) {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
};

module.exports = {
  verifyToken,
  isAdmin,
  isSuperAdmin,
  isInstructor,
  isInstructorOrAdmin,
  isStudent,
  isSelfOrAdmin,
};
