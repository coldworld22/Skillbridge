const logger = require('../../../utils/logger.js');
const redisClient = require("../../../utils/redisClient");
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
const {
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_MAX_AGE,
} = require("../../../config/tokens");

// ─────────────────────────────────────────────────────────────
// 🔧 Config Constants
// ─────────────────────────────────────────────────────────────
const SALT_ROUNDS = 12;
const ACCESS_EXPIRES_IN = "60m";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const OTP_EXPIRY_MINUTES = 15;

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const LOGIN_ATTEMPT_PREFIX = "failedLogin:";

// OTP attempt tracking
const OTP_ATTEMPT_PREFIX = "otpAttempt:";
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_TIME = 15 * 60 * 1000; // 15 minutes

function getAttemptKey(email, ip) {
  return `${LOGIN_ATTEMPT_PREFIX}${email}${ip ? `:${ip}` : ""}`;
}

function getOtpAttemptKey(identifier) {
  return `${OTP_ATTEMPT_PREFIX}${identifier}`;
}

async function recordFailedAttempt(email, ip) {
  if (!redisClient) return;
  const key = getAttemptKey(email, ip);
  let info = { count: 0, lockUntil: null };
  try {
    const data = await redisClient.get(key);
    if (data) info = JSON.parse(data);
    info.count += 1;
    if (info.count >= MAX_ATTEMPTS) {
      info.lockUntil = Date.now() + LOCK_TIME;
    }
    await redisClient.set(key, JSON.stringify(info), { PX: LOCK_TIME });
  } catch (err) {
    logger.error("Failed to record login attempt", err);
  }
}

async function recordFailedOtpAttempt(identifier) {
  if (!redisClient) return;
  const key = getOtpAttemptKey(identifier);
  let info = { count: 0, lockUntil: null };
  try {
    const data = await redisClient.get(key);
    if (data) info = JSON.parse(data);
    info.count += 1;
    if (info.count >= OTP_MAX_ATTEMPTS) {
      info.lockUntil = Date.now() + OTP_LOCK_TIME;
    }
    await redisClient.set(key, JSON.stringify(info), { PX: OTP_LOCK_TIME });
  } catch (err) {
    logger.error("Failed to record OTP attempt", err);
  }
}

async function clearOtpAttempts(identifier) {
  if (!redisClient) return;
  try {
    await redisClient.del(getOtpAttemptKey(identifier));
  } catch (err) {
    logger.error("Failed to clear OTP attempts", err);
  }
}

async function cleanupFailedAttempts() {
  // Redis key TTL handles cleanup automatically
}

/**
 * Register a new user
 */
exports.registerUser = async (data) => {
  // Check duplicate email
  const existingEmail = await userModel.findByEmail(data.email);
  if (existingEmail) throw new AppError("Email is already in use", 409);

  // ✅ Check duplicate phone
  const existingPhone = await userModel.findByPhone(data.phone);
  if (existingPhone) throw new AppError("Phone number is already in use", 409);

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

  const [newUser] = await userModel.insertUser({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
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
  const permissions = await userModel.getUserPermissions(newUser.id);

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

  let attempt = null;
  if (redisClient) {
    try {
      const data = await redisClient.get(getAttemptKey(email, ip));
      attempt = data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error("Failed to check login attempts", err);
    }
  }
  if (attempt && attempt.lockUntil && attempt.lockUntil > Date.now()) {
    throw new AppError("Too many failed login attempts. Try again later.", 429);
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    // Perform a dummy hash to mitigate timing attacks when the user is missing
    await bcrypt.hash(password, SALT_ROUNDS);
    recordFailedAttempt(email);
    throw new AppError("Invalid credentials", 401);
  }

  if (user.status !== "active") {
    throw new AppError("Account is not active", 403);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    await recordFailedAttempt(email, ip);
    throw new AppError("Invalid credentials", 401);
  }

  if (redisClient) {
    try {
      await redisClient.del(getAttemptKey(email, ip));
    } catch (err) {
      logger.error("Failed to clear login attempts", err);
    }
  }

  // Mark user as online on successful login
  await userModel.updateUser(user.id, {
    is_online: true,
    updated_at: new Date(),
  });
  user.is_online = true;

  const roles = await userModel.getUserRoles(user.id);
  const permissions = await userModel.getUserPermissions(user.id);
  const tokenRoles = roles.length ? roles : [user.role];
  const accessToken = generateAccessToken({
    id: user.id,
    role: tokenRoles[0],
    roles: tokenRoles,
  });
  const refreshToken = await issueRefreshToken(user.id, tokenRoles);

  await notificationService.createNotification({
    user_id: user.id,
    type: "login",
    message: "You have logged in successfully",
  });
  const safeUser = sanitizeUserUtil(user);
  return { accessToken, refreshToken, user: { ...safeUser, roles, permissions } };
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
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

async function issueRefreshToken(userId, roles = []) {
  const roleArr = Array.isArray(roles) ? roles : [roles];
  const jti = uuidv4();
  const token = generateRefreshToken(
    { id: userId, role: roleArr[0], roles: roleArr },
    jti
  );
  const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);
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
  const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
  return { ...decoded, roles, role: roles[0] };
};

exports.rotateRefreshToken = async (token) => {
  const decoded = await exports.verifyRefreshToken(token);
  await db("refresh_tokens")
    .where({ id: decoded.jti })
    .update({ revoked_at: new Date() });
  const refreshToken = await issueRefreshToken(decoded.id, decoded.roles);
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

  let attempt = null;
  if (redisClient) {
    try {
      const data = await redisClient.get(getOtpAttemptKey(user.id));
      attempt = data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error("Failed to check OTP attempts", err);
    }
  }
  if (attempt && attempt.lockUntil && attempt.lockUntil > Date.now()) {
    throw new AppError("Too many failed OTP attempts. Try again later.", 429);
  }

  const record = await db("password_resets")
    .where({ user_id: user.id, used: false })
    .andWhere("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .first();

  if (!record) {
    await recordFailedOtpAttempt(user.id);
    throw new AppError("Invalid or expired OTP", 400);
  }

  const match = await bcrypt.compare(code, record.code_hash);
  if (!match) {
    await recordFailedOtpAttempt(user.id);
    throw new AppError("Invalid or expired OTP", 400);
  }

  await clearOtpAttempts(user.id);
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

  let attempt = null;
  if (redisClient) {
    try {
      const data = await redisClient.get(getOtpAttemptKey(user.id));
      attempt = data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error("Failed to check OTP attempts", err);
    }
  }
  if (attempt && attempt.lockUntil && attempt.lockUntil > Date.now()) {
    throw new AppError("Too many failed OTP attempts. Try again later.", 429);
  }

  const resetRecord = await db("password_resets")
    .where({ user_id: user.id, used: false })
    .andWhere("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .first();

  if (!resetRecord) {
    await recordFailedOtpAttempt(user.id);
    throw new AppError("Invalid or expired OTP", 400);
  }

  const match = await bcrypt.compare(code, resetRecord.code_hash);
  if (!match) {
    await recordFailedOtpAttempt(user.id);
    throw new AppError("Invalid or expired OTP", 400);
  }

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
  await clearOtpAttempts(user.id);
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
