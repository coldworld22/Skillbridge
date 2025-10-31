const logger = require('../../../utils/logger.js');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const userModel = require("../../users/user.model");
const db = require("../../../config/database");
const {
  sendOtpEmail,
  sendPasswordChangeEmail,
  sendWelcomeEmail,
  sendNewUserAdminEmail,
} = require("../../../utils/email");
const { generateOtp } = require("../utils/otp");
// Renamed to avoid potential identifier conflicts during runtime
const sanitizeUserUtil = require("../utils/sanitizeUser");
const { OTP_LENGTH } = require("../constants");
const AppError = require("../../../utils/AppError");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const smsService = require("../../../services/smsService");
const verificationService = require("../../verify/verify.service");

// ─────────────────────────────────────────────────────────────
// 🔧 Config Constants
// ─────────────────────────────────────────────────────────────
const SALT_ROUNDS = 12;
const ACCESS_EXPIRES_IN = "60m";
const REFRESH_EXPIRES_IN = "30d";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const OTP_EXPIRY_MINUTES = 15;

// Track failed logins per email with timestamps to aid cleanup
const failedLoginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL = 60 * 1000; // Run cleanup every minute

function recordFailedAttempt(email) {
  const info =
    failedLoginAttempts.get(email) || { timestamps: [], lockUntil: null };
  info.timestamps.push(Date.now());

  if (info.timestamps.length >= MAX_ATTEMPTS) {
    info.lockUntil = Date.now() + LOCK_TIME;
  }

  failedLoginAttempts.set(email, info);
}

/**
 * Periodically purge expired lock entries to prevent memory leaks
 */
function cleanupFailedAttempts() {
  const now = Date.now();
  for (const [email, info] of failedLoginAttempts.entries()) {
    if (info.lockUntil && info.lockUntil <= now) {
      failedLoginAttempts.delete(email);
    }
  }
}

setInterval(cleanupFailedAttempts, CLEANUP_INTERVAL);

/**
 * Register a new user
 */
exports.registerUser = async (data) => {
  // Check duplicate email
  const existingEmail = await userModel.findByEmail(data.email);
  if (existingEmail) throw new AppError("Email is already in use", 409);

  // ✅ Check duplicate phone
  const existingPhone = await userModel.findByPhone(data.phone);
  if (data.phone) {
    const existingPhone = await userModel.findByPhone(data.phone);
    if (existingPhone) throw new AppError("Phone number is already in use", 409);
  }

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

  const [newUser] = await userModel.insertUser({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone || null,
    password_hash: hashed,
    role: data.role || "Student",
    status: "pending",
    is_email_verified: false,
    is_phone_verified: false,
    profile_complete: false,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const roleName = data.role || "Student";
  const roleRow = await db("roles").where({ name: roleName }).first();
  if (roleRow) {
    await db("user_roles").insert({ user_id: newUser.id, role_id: roleRow.id });
  }

  const roles = await userModel.getUserRoles(newUser.id);
  const permissions = typeof userModel.getUserPermissions === "function"
    ? await userModel.getUserPermissions(newUser.id)
    : [];

  const welcomeMessage =
    newUser.role && newUser.role.toLowerCase() === "instructor"
      ?
        "Thank you for joining our platform! Your account is under review. Please complete your profile while we review your account."
      : "Welcome to SkillBridge!";

  await notificationService.createNotification({
    user_id: newUser.id,
    type: "welcome",
    message: welcomeMessage,
  });

  const admins = await userModel.findAdmins();
  const firstAdmin = admins[0];
  if (firstAdmin) {
    await messageService.createMessage({
      sender_id: firstAdmin.id,
      receiver_id: newUser.id,
      message: welcomeMessage,
    });
  }
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "new_user",
        message: `New user ${newUser.full_name} (${newUser.role}) just registered`,

      })
    )
  );
  await Promise.all(
    admins.map((admin) =>
      messageService.createMessage({
        sender_id: newUser.id,
        receiver_id: admin.id,
        message: `New user ${newUser.full_name} (${newUser.role}) just registered`,

      })
    )
  );

  // Send emails
  try {
    await sendWelcomeEmail(newUser.email, newUser.full_name);
    await Promise.all(
      admins.map((admin) =>
        sendNewUserAdminEmail(admin.email, {
          full_name: newUser.full_name,
          email: newUser.email,
        })
      )
    );
  } catch (err) {
    logger.error("Error sending registration emails:", err.message);
  }
  const safeUser = sanitizeUserUtil(newUser);
  return { user: { ...safeUser, roles, permissions } };
};


/**
 * Login user and issue tokens
 */
exports.loginUser = async ({ email, password, ip }) => {
  if (!process.env.JWT_SECRET || !REFRESH_TOKEN_SECRET) {
    const missing = [];
    if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
    if (!REFRESH_TOKEN_SECRET) missing.push("REFRESH_TOKEN_SECRET");
    throw new AppError(
      `Missing environment variable(s): ${missing.join(", ")}`,
      500
    );
  }

  // Clear out any expired lock entries before processing login
  cleanupFailedAttempts();
  const attempt = failedLoginAttempts.get(email);
  if (attempt && attempt.lockUntil && attempt.lockUntil > Date.now()) {
    throw new AppError("Too many failed login attempts. Try again later.", 429);
  }

  let user = await userModel.findByEmail(email);
  if (!user) {
    recordFailedAttempt(email);
    throw new AppError("Invalid credentials", 401);
  }

  const status = (user.status || "").toLowerCase();
  if (!["active", "pending"].includes(status)) {
    throw new AppError("Account is not active", 403);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    recordFailedAttempt(email);
    throw new AppError("Invalid credentials", 401);
  }

  failedLoginAttempts.delete(email);

  // Mark user as online on successful login
  const now = new Date();
  const loginUpdate = {
    is_online: true,
    updated_at: now,
    last_login_at: now,
  };
  if (ip) {
    loginUpdate.last_login_ip = ip;
  }

  try {
    const [updatedUser] = await db("users")
      .where({ id: user.id })
      .update(loginUpdate)
      .returning("*");
    if (updatedUser) {
      user = { ...user, ...updatedUser };
    } else {
      user = { ...user, ...loginUpdate };
    }
  } catch (err) {
    if (err.code === "42703") {
      const [fallback] = await db("users")
        .where({ id: user.id })
        .update({
          is_online: true,
          updated_at: now,
        })
        .returning("*");
      if (fallback) {
        user = { ...user, ...fallback };
      } else {
        user = { ...user, is_online: true, updated_at: now };
      }
    } else {
      throw err;
    }
  }

  const roles = await userModel.getUserRoles(user.id);
  const permissions = typeof userModel.getUserPermissions === "function"
    ? await userModel.getUserPermissions(user.id)
    : [];
  const tokenRoles = roles.length ? roles : [user.role];
  const accessToken = generateAccessToken({ id: user.id, role: tokenRoles[0], roles: tokenRoles });
  const refreshToken = await issueRefreshToken(user.id, tokenRoles[0]);

  await notificationService.createNotification({
    user_id: user.id,
    type: "login",
    message: "You have logged in successfully",
  });
  const safeUser = sanitizeUserUtil(user);
  const onboardingComplete = Boolean(user.profile_complete && user.is_email_verified);
  return {
    accessToken,
    refreshToken,
    user: { ...safeUser, roles, permissions },
    onboarding: {
      profile_complete: user.profile_complete,
      is_email_verified: user.is_email_verified,
      complete: onboardingComplete,
    },
  };
};

/**
 * Generate JWT access token
 */
function generateAccessToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET not configured", 500);
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

exports.generateAccessToken = generateAccessToken;

function generateRefreshToken(payload, jti) {
  if (!REFRESH_TOKEN_SECRET) {
    throw new AppError("REFRESH_TOKEN_SECRET not configured", 500);
  }
  return jwt.sign({ ...payload, jti }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

async function issueRefreshToken(userId, role) {
  const jti = uuidv4();
  const token = generateRefreshToken({ id: userId, role }, jti);
  const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db("refresh_tokens").insert({
    id: jti,
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_at: new Date(),
  });
  return token;
}

exports.issueRefreshToken = issueRefreshToken;

exports.verifyRefreshToken = async (token) => {
  if (!REFRESH_TOKEN_SECRET) {
    throw new AppError("REFRESH_TOKEN_SECRET not configured", 500);
  }
  const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
  const row = await db("refresh_tokens")
    .where({ id: decoded.jti, user_id: decoded.id })
    .first();
  if (!row || row.revoked_at || row.expires_at < new Date()) {
    throw new Error("Invalid refresh token");
  }
  const match = await bcrypt.compare(token, row.token_hash);
  if (!match) throw new Error("Invalid refresh token");
  return decoded;
};

exports.rotateRefreshToken = async (token) => {
  const decoded = await exports.verifyRefreshToken(token);
  await db("refresh_tokens")
    .where({ id: decoded.jti })
    .update({ revoked_at: new Date() });
  const refreshToken = await issueRefreshToken(decoded.id, decoded.role);
  return { decoded, refreshToken };
};

exports.revokeRefreshToken = async (jti) => {
  await db("refresh_tokens").where({ id: jti }).update({ revoked_at: new Date() });
};


/**
 * Generate OTP for password reset and email it to the user.
 * @param {string} email - User email address
 * @returns {Promise<void>}
 */
exports.generateOtp = async (email, via = "email") => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    // simulate work to prevent user enumeration timing attacks
    await bcrypt.hash("dummy", SALT_ROUNDS);
    return;
  }

  if (via === "sms" && (!user.phone || !user.is_phone_verified)) {
    throw new AppError(
      "A verified phone number is required before SMS OTPs can be sent",
      400
    );
  }

  const code = generateOtp(OTP_LENGTH);
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);

  await db("password_resets").insert({
    id: uuidv4(),
    user_id: user.id,
    code_hash: codeHash,
    expires_at: db.raw(
      `CURRENT_TIMESTAMP + INTERVAL '${OTP_EXPIRY_MINUTES} minutes'`
    ),
    used: false,
    created_at: db.fn.now(),
  });

  if (via === "sms") {
    try {
      await smsService.sendSMS({
        to: user.phone,
        text: `Your SkillBridge OTP is: ${code}`,
      });
    } catch (err) {
      throw new AppError(err.message, 503);
    }
  } else {
    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      throw new AppError(err.message, 503);
    }
  }
};

/**
 * Validate an OTP code for the given email address.
 * @param {{email:string, code:string}} data
 * @returns {Promise<boolean>}
 */
exports.verifyOtp = async ({ email, code }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("Invalid user", 400);

  const record = await db("password_resets")
    .where({ user_id: user.id, used: false })
    .andWhere("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .first();

  if (!record) throw new AppError("Invalid or expired OTP", 400);

  const match = await bcrypt.compare(code, record.code_hash);
  if (!match) throw new AppError("Invalid or expired OTP", 400);

  return true;
};

/**
 * Reset a user's password using a valid OTP code.
 * @param {{email:string, code:string, new_password:string}} data
 * @returns {Promise<void>}
 */
exports.resetPassword = async ({ email, code, new_password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("User not found", 404);

  const resetRecord = await db("password_resets")
    .where({ user_id: user.id, used: false })
    .andWhere("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .first();

  if (!resetRecord) throw new AppError("Invalid or expired OTP", 400);

  const match = await bcrypt.compare(code, resetRecord.code_hash);
  if (!match) throw new AppError("Invalid or expired OTP", 400);

  const samePassword = await bcrypt.compare(new_password, user.password_hash);
  if (samePassword) {
    throw new AppError("You already used this password before", 400);
  }

  const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
  await db("users").where({ id: user.id }).update({ password_hash: hashed });

  await db("password_resets").where({ id: resetRecord.id }).update({ used: true });

  await sendPasswordChangeEmail(user.email);

  await notificationService.createNotification({
    user_id: user.id,
    type: "security",
    message: "Your password was changed successfully",
  });
  return sanitizeUserUtil(user);
};

/**
 * Send an OTP for verifying a user's email or phone.
 * Delegates to the verification service which handles storage and delivery.
 * @param {{user_id:number,type:'email'|'phone'}} data
 * @returns {Promise<void>}
 */
exports.sendVerificationOtp = async ({ user_id, type }) => {
  await verificationService.sendOtp(user_id, type);
};

/**
 * Confirm a verification OTP and mark the email or phone as verified.
 * @param {{user_id:number,type:'email'|'phone',code:string}} data
 * @returns {Promise<void>}
 */
exports.confirmVerificationOtp = async ({ user_id, type, code }) => {
  await verificationService.verifyOtp(user_id, type, code);
};
