const db = require("../../config/database");

module.exports = function verifyPermission(code) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const roleIds = await db("user_roles")
        .where({ user_id: req.user.id })
        .pluck("role_id");

      if (!roleIds.length) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const perms = await db("role_permissions")
        .join("permissions", "role_permissions.permission_id", "permissions.id")
        .whereIn("role_permissions.role_id", roleIds)
        .pluck("permissions.code");

      if (!perms.includes(code)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
