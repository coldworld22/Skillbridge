// 📁 modules/users/usersmanagment/users.routes.js

const express = require("express");
const router = express.Router();
const controller = require("./users.controller");
const validate = require("../../../middleware/validate");
const logger = require("../../../utils/logger");

const { isAdmin } = require("../../../middleware/auth/authMiddleware");
const { can } = require("../../../services/entitlements");
const {
  requireEntitlement,
  sendEntitlementDenied,
} = require("../../../middleware/tenant");
const {
  statusSchema,
  roleSchema,
  avatarSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
  partialUpdateSchema,
  createUserSchema,
} = require("./users.validator");

const enforceInstructorQuota = async (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }
  try {
    const role = String(req.body?.role || "").toLowerCase();
    if (role !== "instructor") {
      return next();
    }
    const decision = await can(
      { tenantId: req.tenant?.id, role: req.role, userId: req.user?.id },
      "instructor.add",
    );
    if (!decision.allow) {
      return sendEntitlementDenied(res, decision, "instructor.add");
    }
    return next();
  } catch (err) {
    logger.warn?.("entitlement check failed", {
      error: err.message,
      action: "instructor.add",
    });
    return res.status(500).json({ error: "entitlement_check_failed" });
  }
};

// ✅ Routes with validation
router.get("/users", isAdmin, controller.getAllUsers);
router.get("/:id", isAdmin, controller.getUserById);

/**
 * * User Management Routes(add)
 * * Admin only
 */
router.post(
  "/",
  isAdmin,
  validate(createUserSchema),
  requireEntitlement("user.invite"),
  enforceInstructorQuota,
  controller.createUser,
);

/**
 * * User Management Routes(Update)
 * * Admin only
 */
router.patch("/:id", isAdmin, validate(partialUpdateSchema), controller.updateUserProfile);

router.patch("/:id/status", isAdmin, validate(statusSchema), controller.updateUserStatus);
router.patch("/:id/role", isAdmin, validate(roleSchema), controller.changeUserRole);
router.patch("/:id/avatar", isAdmin, validate(avatarSchema), controller.uploadUserAvatar);
router.patch("/:id", isAdmin, validate(partialUpdateSchema), controller.updateUserProfile);

router.delete("/:id", isAdmin, controller.deleteUser);
router.post("/:id/reset-password", isAdmin, controller.resetUserPassword);
router.delete("/:id/identity", isAdmin, controller.removeUserIdentity);
router.patch("/:id/restore", isAdmin, controller.restoreUser);

router.post("/bulk-update-status", isAdmin, validate(bulkStatusSchema), controller.bulkUpdateStatus);
router.post("/bulk-delete", isAdmin, validate(bulkDeleteSchema), controller.bulkDeleteUsers);

module.exports = router;
