// 📁 src/modules/auth/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", authController.register);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh token cookie
 * @access  Public
 */
router.post("/refresh", authController.refreshToken);

/**
 * @route   POST /auth/logout
 * @desc    Clear refresh token cookie and logout
 * @access  Public
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /auth/request-reset
 * @desc    Send OTP to user's email for password reset
 * @access  Public
 */
router.post("/request-reset", authController.requestReset);

/**
 * @route   POST /auth/verify-otp
 * @desc    Verify submitted OTP code
 * @access  Public
 */
router.post("/verify-otp", authController.verifyOtp);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password using valid OTP
 * @access  Public
 */
router.post("/reset-password", authController.resetPassword);

module.exports = router;
