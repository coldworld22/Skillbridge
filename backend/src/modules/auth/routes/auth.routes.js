// 📁 src/modules/auth/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const socialAuthController = require("../controllers/socialAuth.controller");
const validate = require("../../../middleware/validate");
const authValidation = require("../validators/auth.validator");
const { limitAuthRequests } = require("../../../middleware/rateLimiter");

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validate(authValidation.registerSchema), authController.register);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post("/login", limitAuthRequests, validate(authValidation.loginSchema), authController.login);

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
router.post("/request-reset", limitAuthRequests, validate(authValidation.otpRequestSchema), authController.requestReset);

/**
 * @route   POST /auth/verify-otp
 * @desc    Verify submitted OTP code
 * @access  Public
 */
router.post("/verify-otp", validate(authValidation.otpVerifySchema), authController.verifyOtp);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password using valid OTP
 * @access  Public
 */
router.post("/reset-password", validate(authValidation.resetPasswordSchema), authController.resetPassword);

// ─────────────────────────────────────────────────────────────
// Social login routes
// ─────────────────────────────────────────────────────────────

router.get("/google", socialAuthController.googleAuth);
router.get("/google/callback", socialAuthController.googleCallback);

module.exports = router;
