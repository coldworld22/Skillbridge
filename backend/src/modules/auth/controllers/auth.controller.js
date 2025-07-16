
/**
 * @todo 🔐 Full Password Recovery Hardening & Code Standardization
 *
 * 📌 SECURITY IMPROVEMENTS:
 * - ✅ Apply `limitAuthRequests` middleware to `/auth/verify-otp` and `/auth/reset-password`
 *   to prevent brute-force OTP attacks.
 * - ✅ Hash OTP codes before storing in `password_resets` table (use `bcrypt.hash`).
 * - ✅ Verify OTP using `bcrypt.compare` instead of plain match.
 * - ✅ Enforce backend password complexity:
 *     • Minimum 8 characters
 *     • At least 1 uppercase letter
 *     • At least 1 special character
 *     • Match frontend rules to prevent bypass
 * - ✅ Invalidate all active sessions after successful password reset (optional but recommended).
 * - ✅ Return generic messages for expired or invalid OTPs to avoid info leaks.
 *
 * 🧼 CODE QUALITY & ORGANIZATION:
 * - ✅ Use consistent modular structure: separate route, controller, service, and validator files.
 * - ✅ Add JSDoc-style comments for all exported functions (`@desc`, `@param`, `@returns`).
 * - ✅ Move shared constants (password regex, OTP length) to a `constants.js` file.
 * - ✅ Ensure error handling uses consistent structure with custom error classes (if available).
 * - ✅ Avoid duplicated logic — reuse functions like `generateOtp`, `sendEmail`, `hashPassword`.
 *
 * 📬 EMAIL & UX:
 * - ✅ Use verified sender email (`support@eduskillbridge.net`) for all outbound mail.
 * - ✅ Brand email content with app name and logo.
 * - ✅ Include contact support and generic footer in all transactional emails.
 *
 * 🧪 TEST COVERAGE:
 * - ✅ Test OTP expiry, invalid OTPs, reused OTPs, rate-limited requests.
 * - ✅ Validate new password strength during reset (unit and integration tests).
 * - ✅ Mock email sending in tests and verify `sendMail` was called correctly.
 *
 * 🛡️ OPTIONAL ENHANCEMENTS:
 * - [ ] Log user IP/user-agent during OTP request for forensic tracking.
 * - [ ] Add audit log entries for password reset success/failure.
 * - [ ] Implement feature flag to disable password reset temporarily via `.env`.
 *
 * ✅ Outcome:
 * This section must meet OWASP security standards, backend/frontend parity,
 * and clean, documented, test-covered code architecture.
 */

const authService = require("../services/auth.service");
const userModel = require("../../users/user.model");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

// 🔧 Cookie options used in login and logout
const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",

  domain: process.env.COOKIE_DOMAIN,

  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * @desc Register a new user
 * @access Public
 */
exports.register = catchAsync(async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("🔥 Registration error caught:");
    console.error("Name:", err.name);
    console.error("Code:", err.code);
    console.error("Detail:", err.detail);
    console.error("Message:", err.message);

    // ✅ PostgreSQL duplicate key error (code 23505)
    if (err.code === "23505") {
      if (err.detail.includes("users_email_unique")) {
        return res.status(400).json({ error: "Email is already registered" });
      }
      if (err.detail.includes("users_phone_unique")) {
        return res.status(400).json({ error: "Phone number is already registered" });
      }
    }

    // ⛔ Unknown error — fallback to generic
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
});


/**
 * @desc Authenticate user and return access/refresh tokens
 * @access Public
 */
exports.login = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.loginUser(req.body);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions).json({ accessToken, user });
});

/**
 * @desc Refresh access token using refresh token cookie
 * @access Public
 */
exports.refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "Missing refresh token" });

  try {
    const decoded = authService.verifyRefreshToken(token);
    const accessToken = authService.generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });
    res.json({ accessToken });
  } catch (err) {
    console.error("❌ Refresh token error:", err.message);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

/**
 * @desc Logout user by clearing refresh token
 * @access Public
 */
exports.logout = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const decoded = authService.verifyRefreshToken(token);
      const user = await userModel.findById(decoded.id);
      if (user && user.role && user.role.toLowerCase() === "instructor") {
        await userModel.updateUser(user.id, { is_online: false });
      }
    } catch (err) {
      console.error("Failed to update online status on logout:", err.message);
    }
  }
  res.clearCookie("refreshToken", refreshCookieOptions);
  res.json({ message: "Logged out successfully" });
});

/**
 * @desc Send OTP to user's email for password reset
 * @access Public
 */
exports.requestReset = catchAsync(async (req, res) => {
  const { email } = req.body;
  // Ensure the email exists before attempting to send an OTP
  const userExists = await userModel.findByEmail(email);
  if (!userExists) {
    throw new AppError("Email not found", 404);
  }

  await authService.generateOtp(email);
  res.json({ message: "OTP sent to email" });
});

/**
 * @desc Verify submitted OTP code
 * @access Public
 */
exports.verifyOtp = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const isValid = await authService.verifyOtp({ email, code });
  res.json({ valid: isValid });
});

/**
 * @desc Reset password using valid OTP
 * @access Public
 */
exports.resetPassword = catchAsync(async (req, res) => {
  const { email, code, new_password } = req.body;
  await authService.resetPassword({ email, code, new_password });
  res.json({ message: "Password reset successful" });
});

/**
 * @desc Send OTP for email or phone verification
 * @access Public
 */
exports.sendVerification = catchAsync(async (req, res) => {
  await authService.sendVerificationOtp(req.body);
  res.json({ message: "Verification OTP sent" });
});

/**
 * @desc Confirm verification OTP and mark email/phone as verified
 * @access Public
 */
exports.confirmVerification = catchAsync(async (req, res) => {
  await authService.confirmVerificationOtp(req.body);
  res.json({ message: "Verification successful" });
});
