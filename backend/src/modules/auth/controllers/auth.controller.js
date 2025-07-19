const authService = require("../services/auth.service");
const userModel = require("../../users/user.model");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const socialLoginConfigService = require("../../socialLoginConfig/socialLoginConfig.service");
const recaptchaService = require("../../recaptcha/recaptcha.service");

// 🔧 Cookie options used in login and logout
const { refreshCookieOptions } = require("../../../utils/cookie");

/**
 * @desc Register a new user
 * @access Public
 */
exports.register = catchAsync(async (req, res, next) => {
  try {
    const cfg = await socialLoginConfigService.getSettings();
    if (cfg?.recaptcha?.active) {
      const valid = await recaptchaService.verify(req.body.recaptchaToken, req.ip);
      if (!valid) {
        throw new AppError('Failed reCAPTCHA verification', 400);
      }
    }
    const { user } = await authService.registerUser(req.body);
    res.status(201).json({ message: "Registration successful", user });
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

    // Handle expected AppError instances thrown by the service
    if (err instanceof AppError && err.isOperational) {
      return res.status(err.statusCode).json({ error: err.message });
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
  // TODO: Re-enable reCAPTCHA verification once login issues are resolved
  // const cfg = await socialLoginConfigService.getSettings();
  // if (cfg?.recaptcha?.active) {
  //   const valid = await recaptchaService.verify(req.body.recaptchaToken, req.ip);
  //   if (!valid) {
  //     throw new AppError('Failed reCAPTCHA verification', 400);
  //   }
  // }
  const { accessToken, refreshToken, user } = await authService.loginUser(req.body);
  res
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json({ accessToken, user });
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
