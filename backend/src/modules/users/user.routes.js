// ✅ 📁 src/modules/users/user.routes.js
const express = require("express");
const router = express.Router();

const userController = require("./user.controller");
const { verifyToken, isAdmin, isSelfOrAdmin } = require("../../middleware/authMiddleware");
const upload = require("../../middleware/uploadMiddleware"); 
const uploadVideo = require("../../middleware/videoUploadMiddleware");




// ─────────────────────────────────────────────────────────────────────
// 📄 User Management Routes (CRUD, Role, Status, Avatar, Export)
// All routes are secured with verifyToken, then role-based guards
// ─────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────
// 🔍 Get all users (Admin only, with pagination & search)
// ─────────────────────────────────────────────────────────────────────
router.get("/", verifyToken, isAdmin, userController.getAllUsers);

// ─────────────────────────────────────────────────────────────────────
// 👤 Get logged-in user's base profile
// ─────────────────────────────────────────────────────────────────────
router.get("/me", verifyToken, userController.getMe);

// ─────────────────────────────────────────────────────────────────────
// 📋 Get full merged profile (user + role + socialLinks)
// ─────────────────────────────────────────────────────────────────────
router.get("/me/full-profile", verifyToken, userController.getMyFullProfile);

// ─────────────────────────────────────────────────────────────────────
// 📋 Complete profile submission (User + Role + Social)
// ─────────────────────────────────────────────────────────────────────
router.put("/:id/complete-profile", verifyToken, isSelfOrAdmin, userController.completeProfile);


// ─────────────────────────────────────────────────────────────────────
// upload video
// ─────────────────────────────────────────────────────────────────────
router.patch("/:id/demo-video", verifyToken, isSelfOrAdmin, uploadVideo.single("video"), userController.uploadDemoVideo);

// ➕ Create new user (Admin only)
router.post("/", verifyToken, isAdmin, userController.createUser);

// ─────────────────────────────────────────────────────────────────────
// 🔄 Update basic user fields (Only self or Admin)
// ─────────────────────────────────────────────────────────────────────
router.put("/:id", verifyToken, isSelfOrAdmin, userController.updateUser);


// ─────────────────────────────────────────────────────────────────────
// // 📸 Upload or update profile avatar (Self or Admin)
// ─────────────────────────────────────────────────────────────────────
router.patch("/:id/avatar", verifyToken, isSelfOrAdmin, upload.single("avatar"), userController.updateAvatar);

// 👁 View a single user by ID (Self or Admin)
router.get("/:id", verifyToken, isSelfOrAdmin, userController.getUserById);

// ─────────────────────────────────────────────────────────────────────
// 🔁 Toggle active/inactive user status (Admin only)
// ─────────────────────────────────────────────────────────────────────
router.patch("/:id/status", verifyToken, isAdmin, userController.toggleUserStatus);

// ─────────────────────────────────────────────────────────────────────
// // 👑 Update user's role (Admin only)
// ─────────────────────────────────────────────────────────────────────
router.patch("/:id/role", verifyToken, isAdmin, userController.updateUserRole);

// 🚫 Ban a user (Admin only)
router.patch("/:id/ban", verifyToken, isAdmin, userController.banUser);

// ─────────────────────────────────────────────────────────────────────
// ✅ Unban a user (Admin only)
// ─────────────────────────────────────────────────────────────────────
router.patch("/:id/unban", verifyToken, isAdmin, userController.unbanUser);

// ─────────────────────────────────────────────────────────────────────
// 🗑 Soft delete (mark user as deleted/inactive)
// ─────────────────────────────────────────────────────────────────────
router.delete("/:id", verifyToken, isAdmin, userController.softDeleteUser);


// ─────────────────────────────────────────────────────────────────────
// 📦 Export all users to CSV (Admin only)
// ─────────────────────────────────────────────────────────────────────
router.get("/export/csv", verifyToken, isAdmin, userController.exportUsers);

// ─────────────────────────────────────────────────────────────────────
module.exports = router;
