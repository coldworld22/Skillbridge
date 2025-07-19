/**
 * @file user.routes.js
 * @desc Central router for all user-related endpoints.
 *       Includes public/global features and protected role-based features (admin, instructor, student).
 */

const express = require("express");
const router = express.Router();
const profileController = require("./profile.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

// ==============================================
// 🔁 GLOBAL FEATURES (public or shared access)
// ==============================================

/**
 * @route   /api/categories
 * @desc    Global category system (view, manage, filter)
 */
const categoryRoutes = require("./categories/category.routes");
router.use("/categories", categoryRoutes);

/**
 * @route   /api/users/tutorials
 * @desc    Tutorials module — includes:
 *          - Public browsing (GET /, /:id, /featured)
 *          - Admin management (POST/PUT/DELETE /admin/...)
 *          Uses internal middleware for protection
 */
const tutorialRoutes = require("./tutorials/tutorial.routes");
router.use("/tutorials", tutorialRoutes);

/**
 * @route   /api/users/classes
 * @desc    Online classes module
 */
const classRoutes = require("../classes/class.routes");
router.use("/classes", classRoutes);

// ---------------------------------------------------------------------------
// Profile helpers for current authenticated user
// ---------------------------------------------------------------------------
router.get("/me/full-profile", verifyToken, profileController.getFullProfile);


// ==============================================
// 🔐 ROLE-BASED FEATURES (protected by auth)
// ==============================================

/**
 * @route   /api/users/admin
 * @desc    Admin dashboard: users, analytics, moderation, approvals, etc.
 */
const adminRoutes = require("./admin/admin.routes");
router.use("/admin", adminRoutes);

/**
 * @route   /api/users/instructor
 * @desc    Instructor dashboard: classes, assignments, resources, ads, bookings
 */
const instructorRoutes = require("./instructor/instructor.routes");
router.use("/instructor", instructorRoutes);

/**
 * @route   /api/users/student
 * @desc    Student dashboard: enrollments, certificates, support, group chats
 */
const studentRoutes = require("./student/student.routes");
router.use("/student", studentRoutes);


// ✅ Export unified router
module.exports = router;
