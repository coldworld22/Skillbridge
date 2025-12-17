// 📁 modules/users/usersmanagment/users.routes.js

const express = require("express");
const router = express.Router();
const controller = require("./users.controller");
const validate = require("../../../middleware/validate");

const { isAdmin } = require("../../../middleware/auth/authMiddleware");
const {
  statusSchema,
  roleSchema,
  avatarSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
  partialUpdateSchema,
  createUserSchema 
} = require("./users.validator");

// ✅ Routes with validation
router.get("/users", isAdmin, controller.getAllUsers);
router.get("/:id", isAdmin, controller.getUserById);

/**
 * * User Management Routes(add)
 * * Admin only
 */
router.post("/", isAdmin, validate(createUserSchema), controller.createUser);

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
