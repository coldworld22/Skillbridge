// 📁 src/middleware/auth/authMiddleware.js
const jwt = require("jsonwebtoken");
const userModel = require("../../modules/users/user.model");
const {
  addToken: addTokenToStore,
  isTokenBlacklisted,
} = require("../../services/tokenBlacklistService");
const { normalizeRole, isAdminRole } = require("../../utils/role");

const ONBOARDING_ALLOWED_PATTERNS = [
  /^\/api\/users\/profile$/i,
  /^\/api\/users\/me\/full-profile$/i,
  /^\/api\/users\/[^/]+\/(avatar|demo-video)$/i,
  /^\/api\/users\/student\/profile$/i,
  /^\/api\/users\/student\/[^/]+\/(avatar|identity)$/i,
  /^\/api\/users\/instructor\/profile(?:\/status)?$/i,
  /^\/api\/users\/instructor\/[^/]+\/(avatar|demo)$/i,
  /^\/api\/users\/admin\/profile(?:\/.*)?$/i,
  /^\/api\/users\/instructor\/certificates(?:\/[^/]+)?$/i,
  /^\/api\/users\/instructor\/status$/i,
  /^\/api\/notifications(?:\/.*)?$/i,
  /^\/api\/messages(?:\/.*)?$/i,
  /^\/api\/verify\/email\/(send|confirm)$/i,
  /^\/api\/verify\/phone\/(send|confirm)$/i,
  /^\/api\/auth\/logout$/i,
];

function isOnboardingPathAllowed(url) {
  const path = url.split("?")[0];
  return ONBOARDING_ALLOWED_PATTERNS.some((regex) => regex.test(path));
}


/**
 * 🔐 Middleware: Verifies JWT access token
 * - Requires token in the Authorization header
 * - Decodes and attaches `req.user` if valid
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Missing or malformed token" });
  }

  if (await isTokenBlacklisted(token)) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return res
        .status(500)
        .json({ message: "JWT secret not configured" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    const status = (user.status || "").toLowerCase();
    if (!["active", "pending"].includes(status)) {
      return res.status(403).json({ message: "Account is not active" });
    }
    const onboardingComplete = Boolean(user.profile_complete && user.is_email_verified);
    if (
      !onboardingComplete &&
      !isOnboardingPathAllowed(req.originalUrl || "")
    ) {
      return res.status(403).json({
        message: "Complete your profile and verify your email to continue.",
        onboarding: {
          profile_complete: user.profile_complete,
          is_email_verified: user.is_email_verified,
        },
      });
    }
    const roles = await userModel.getUserRoles(decoded.id);
    const userRoles = roles.length ? roles : [user.role];
    let permissions = await userModel.getUserPermissions(decoded.id);
    if (userRoles.map((r) => normalizeRole(r)).includes("superadmin")) {
      permissions = await userModel.getAllPermissionCodes();
    }
    const { password_hash, ...safeUser } = user;
    req.user = {
      ...decoded,
      ...safeUser,
      roles: userRoles,
      role: userRoles[0],
      permissions,
      onboardingComplete,
    };
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

const hasPermission = (...perms) => (req, res, next) => {
  const roles = req.user.roles || [req.user.role];
  if (roles.map((r) => normalizeRole(r)).includes("superadmin")) {
    return next();
  }
  const userPerms = req.user?.permissions || [];
  if (perms.some((p) => userPerms.includes(p))) {
    return next();
  }
  return res.status(403).json({ message: "Insufficient permission" });
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
  hasPermission,
  addTokenToBlacklist: addTokenToStore,
  isTokenBlacklisted,
};
