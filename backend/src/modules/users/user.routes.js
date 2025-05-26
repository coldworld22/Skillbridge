/**
 * Student profile controller
 * @file student.controller.js
 */


const express = require("express");
const router = express.Router();



// 🧠 Import role-specific subroutes
const adminRoutes = require("./admin/admin.routes");
const instructorRoutes = require("./instructor/instructor.routes")
const studentRoutes = require("./student/student.routes");

// Middleware to verify token and determine user role

router.use("/admin", adminRoutes);
router.use("/instructor", instructorRoutes);
router.use("/student", studentRoutes);

module.exports = router;
