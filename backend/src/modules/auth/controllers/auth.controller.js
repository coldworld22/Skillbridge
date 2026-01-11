const logger = require("../../../utils/logger.js");
const authService = require("../services/auth.service");
const userModel = require("../../users/user.model");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const socialLoginConfigService = require("../../socialLoginConfig/socialLoginConfig.service");
const recaptchaService = require("../../recaptcha/recaptcha.service");
const authMiddleware = require("../../../middleware/auth/authMiddleware");
const db = require("../../../config/database");

// 🔧 Cookie options used in login and logout
const {
  refreshCookieOptions,
  csrfCookieOptions,
  accessCookieOptions,
} = require("../../../utils/cookie");

/**
 * @desc Register a new user
 * @access Public
 */
exports.register = catchAsync(async (req, res, next) => {
  try {
    const cfg = await socialLoginConfigService.getSettings();
    if (cfg?.recaptcha?.active) {
      const valid = await recaptchaService.verify(
        req.body.recaptchaToken,
        req.ip,
      );
      if (!valid) {
        throw new AppError("Failed reCAPTCHA verification", 400);
      }
    }
    const { user } = await authService.registerUser(req.body);
    res.status(201).json({ message: "Registration successful", user });
  } catch (err) {
    logger.error("🔥 Registration error caught:");
    logger.error("Name:", err.name);
    logger.error("Code:", err.code);
    logger.error("Detail:", err.detail);
    logger.error("Message:", err.message);

    // ✅ PostgreSQL duplicate key error (code 23505)
    if (err.code === "23505") {
      if (err.detail?.includes("users_email_unique")) {
        return res.status(400).json({ error: "Email is already registered" });
      }
      if (err.detail?.includes("users_phone_unique")) {
        return res
          .status(400)
          .json({ error: "Phone number is already registered" });
      }
    }

    // Handle expected AppError instances thrown by the service
    if (err instanceof AppError && err.isOperational) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    // ⛔ Unknown error — fallback to generic
    logger.error("Registration error:", err);
    return res
      .status(500)
      .json({ error: "Registration failed. Please try again." });
  }
});

/**
 * @desc Authenticate user and return access/refresh tokens
 * @access Public
 */
exports.login = catchAsync(async (req, res) => {
  const cfg = await socialLoginConfigService.getSettings();
  if (cfg?.recaptcha?.active) {
    const valid = await recaptchaService.verify(
      req.body.recaptchaToken,
      req.ip,
    );
    if (!valid) {
      throw new AppError("Failed reCAPTCHA verification", 400);
    }
  }
  const { accessToken, refreshToken, user, onboarding, memberships, currentTenantId } =
    await authService.loginUser({
      ...req.body,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  res
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .cookie("token", accessToken, accessCookieOptions)
    .json({
      message: "Login successful",
      accessToken,
      user,
      memberships,
      currentTenantId,
      onboarding,
    });
});

/**
 * @desc Refresh access token using refresh token cookie
 * @access Public
 */
exports.refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (process.env.NODE_ENV !== "production") {
    logger.debug(
      "\uD83D\uDD04 Refresh token endpoint hit. Token present:",
      Boolean(token),
    );
  }
  if (!token) {
    logger.warn("\u26A0\uFE0F Missing refresh token cookie");
    return res.status(401).json({ message: "Missing refresh token" });
  }

  try {
    const {
      decoded,
      refreshToken: newRefreshToken,
      accessToken,
    } = await authService.rotateRefreshToken(token);
    if (process.env.NODE_ENV !== "production") {
      logger.debug("\u2705 Refresh token rotated for user", decoded.id);
    }
    res
      .cookie("refreshToken", newRefreshToken, refreshCookieOptions)
      .cookie("token", accessToken, accessCookieOptions)
      .json({ message: "Token refreshed", accessToken });
  } catch (err) {
    logger.error("❌ Refresh token error:", err.message);
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
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
      const decoded = await authService.verifyRefreshToken(token);
      await authService.revokeRefreshToken(decoded.jti);
      await userModel.updateUser(decoded.id, {
        is_online: false,
        updated_at: new Date(),
      });
    } catch (err) {
      logger.error("Failed to update online status on logout:", err.message);
    }
  }
  if (req.headers.authorization?.startsWith("Bearer ")) {
    const access = req.headers.authorization.split(" ")[1];
    await authMiddleware.addTokenToBlacklist(access);
  }
  res
    .clearCookie("refreshToken", refreshCookieOptions)
    .clearCookie("csrfToken", csrfCookieOptions)
    .clearCookie("token", accessCookieOptions)
    .json({ message: "Logged out successfully" });
});

/**
 * @desc List tenant memberships for current user
 * @access Authenticated
 */
exports.listMemberships = catchAsync(async (req, res) => {
  const memberships = await db("tenant_memberships")
    .select("tenant_id", "role", "status")
    .where({ user_id: req.user.id });
  res.json({ data: memberships });
});

/**
 * @desc Switch active tenant; returns a new access token scoped to that tenant
 * @access Authenticated
 */
exports.switchTenant = catchAsync(async (req, res) => {
  const { tenant_id } = req.body || {};
  if (!tenant_id) {
    throw new AppError("tenant_id is required", 400);
  }
  const memberships =
    req.user?.memberships ||
    (await db("tenant_memberships")
      .select("tenant_id", "role", "status")
      .where({ user_id: req.user.id, status: "active" }));
  const membershipTenantIds = new Set(memberships.map((m) => m.tenant_id));
  if (!membershipTenantIds.has(tenant_id)) {
    throw new AppError("Tenant membership not found", 403);
  }
  const payload = {
    id: req.user.id,
    role: req.user.role,
    roles: req.user.roles || [req.user.role],
    platform_role: req.user.platform_role || "none",
    memberships,
    current_tenant_id: tenant_id,
  };
  const accessToken = authService.generateAccessToken(payload);
  res
    .cookie("token", accessToken, accessCookieOptions)
    .json({ message: "Tenant switched", currentTenantId: tenant_id, accessToken });
});

/**
 * @desc Send OTP to user's email for password reset
 * @access Public
 */
exports.requestReset = catchAsync(async (req, res) => {
  const { email, via } = req.body;
  await authService.generateOtp(email, via);
  res.json({ message: "If that email exists, an OTP has been sent" });
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
