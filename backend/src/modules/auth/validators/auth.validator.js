// 📁 src/modules/auth/validators/auth.validator.js
const { z } = require("zod");

/**
 * @desc Validation for user registration
 */
exports.registerSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(12, "Phone number must be at least 12 digits"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["Student", "Instructor", "Admin"]).optional() // Optional for fallback logic
});

/**
 * @desc Validation for login
 */
exports.loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

/**
 * @desc Validation for requesting OTP
 */
exports.otpRequestSchema = z.object({
  email: z.string().email("Invalid email"),
});

/**
 * @desc Validation for verifying OTP
 */
exports.otpVerifySchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().length(6, "OTP code must be 6 digits"),
});

/**
 * @desc Validation for resetting password using OTP
 */
exports.resetPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().length(6, "OTP code must be 6 digits"),
  new_password: z.string().min(6, "New password must be at least 6 characters long"),
});
