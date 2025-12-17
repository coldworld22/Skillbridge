/**
 * Category Routes
 * @file category.routes.js
 * @see docs/admin-category-management.md
 */
const express = require("express");
const router = express.Router();
const controller = require("./category.controller");
const upload = require("./categoryUploadMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../../middleware/storage");

/**
 * Middleware for authentication and authorization
 */
const {
  verifyToken,
  isAdmin,
} = require("../../../middleware/auth/authMiddleware");

/**
 * 🔐 Admin routes (protected)
 */
router.post(
  "/create",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("category.manage"),
  isAdmin,
  upload,
  checkAndConsumeStorage(),
  controller.createCategory,
);
router.put(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("category.manage"),
  isAdmin,
  upload,
  checkAndConsumeStorage(),
  controller.updateCategory,
);
router.patch(
  "/:id/status",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("category.manage"),
  isAdmin,
  controller.updateCategoryStatus,
);
router.delete(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("category.manage"),
  isAdmin,
  controller.deleteCategory,
);

/**
 * 🔓 Public routes (open for browsing)
 */

router.get("/", controller.getAllCategories);
router.get("/tree", controller.getNestedCategories);
router.get("/:id", controller.getCategoryById);

module.exports = router;
