/**
 * Category Routes
 * @file category.routes.js
 * @see docs/admin-category-management.md
 */
const express = require("express");
const router = express.Router();
const controller = require("./category.controller");
const upload = require("./categoryUploadMiddleware");

/**
 * Middleware for authentication and authorization
 */
const { verifyToken, isAdmin } = require("../../../middleware/auth/authMiddleware");

/**
 * 🔐 Admin routes (protected)
 */
router.post("/create", verifyToken, isAdmin, upload, controller.createCategory);
router.put("/:id", verifyToken, isAdmin, upload, controller.updateCategory);
router.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  controller.updateCategoryStatus
);
router.delete("/:id", verifyToken, isAdmin, controller.deleteCategory);

/**
 * 🔓 Public routes (open for browsing)
 */

router.get("/", controller.getAllCategories);
router.get("/tree", controller.getNestedCategories);
router.get("/:id", controller.getCategoryById);

module.exports = router;
