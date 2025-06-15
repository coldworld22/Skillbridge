// 📁 src/middleware/auth/authMiddleware.js
const jwt = require("jsonwebtoken");
const userModel = require("../../modules/users/user.model");

/**
 * ✅ Helper: Determines if a role has admin-level access
 */
// Normalize role string for consistent comparisons
const normalizeRole = (role = "") => role.toLowerCase().replace(/\s+/g, "");

const isAdminRole = (roles = []) => {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => normalizeRole(r))
    .some((r) => ["admin", "superadmin"].includes(r));
};


/**
 * 🔐 Middleware: Verifies JWT access token
 * - Requires token in the Authorization header
 * - Decodes and attaches `req.user` if valid
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or malformed token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const roles = await userModel.getUserRoles(decoded.id);
    req.user = { ...decoded, roles, role: roles[0] };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * 🔐 Middleware: Restrict access to Admin and SuperAdmin roles
 */
const isAdmin = (req, res, next) => {
  if (!req.user || !isAdminRole(req.user.roles || req.user.role)) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

/**
 * 🔐 Middleware: Restrict access to SuperAdmin only
 */
const isSuperAdmin = (req, res, next) => {
  const roles = req.user.roles || [req.user.role];
  if (roles.map((r) => normalizeRole(r)).includes("superadmin")) {
    return next();
  }
  return res.status(403).json({ message: "SuperAdmin access only" });
};

/**
 * 🔐 Middleware: Restrict access to Instructor only
 */
const isInstructor = (req, res, next) => {
  const roles = req.user.roles || [req.user.role];
  if (roles.map((r) => normalizeRole(r)).includes("instructor")) {
    return next();
  }
  return res.status(403).json({ message: "Instructor access only" });
};

/**
 * 🔐 Middleware: Allow Instructor or Admin roles
 */
const isInstructorOrAdmin = (req, res, next) => {
  const roles = req.user.roles || [req.user.role];
  const norm = roles.map((r) => normalizeRole(r));
  if (norm.includes("instructor") || norm.some((r) => ["admin", "superadmin"].includes(r))) {
    return next();
  }
  return res.status(403).json({ message: "Instructor or Admin access only" });
};

/**
 * 🔐 Middleware: Restrict access to Student only
 */
const isStudent = (req, res, next) => {
  const roles = req.user.roles || [req.user.role];
  if (roles.map((r) => normalizeRole(r)).includes("student")) return next();
  return res.status(403).json({ message: "Access denied. Students only." });
};

/**
 * 🔐 Middleware: Allows access if user is self or has admin/superadmin role
 */
const isSelfOrAdmin = (req, res, next) => {
  if (isAdminRole(req.user.roles || req.user.role) || req.user.id === req.params.id) {
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
