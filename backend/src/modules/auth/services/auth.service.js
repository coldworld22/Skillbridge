const logger = require('../../../utils/logger.js');
const redisClient = require("../../../utils/redisClient");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
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
const { addToken } = require("../../../services/tokenBlacklistService");
const verificationService = require("../../verify/verify.service");
const { resolvePrimaryRole } = require("../../../utils/role");
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

// Bcrypt only hashes the first 72 bytes of input which can silently truncate
// long refresh tokens. To avoid rejecting valid tokens we migrate to a SHA-256
// based hash (stored as base64) while still accepting legacy bcrypt hashes
// stored in the database. We also support the interim SHA-256 hex strings
// produced during the initial rollout. Once those tokens expire naturally we
// can remove the fallbacks.
const BCRYPT_HASH_PREFIXES = ["$2a$", "$2b$", "$2y$"];

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest();

const encodeRefreshTokenHash = (buffer) => buffer.toString("base64");

const decodeRefreshTokenHash = (storedHash) => {
  if (!storedHash) return null;

  // Preferred encoding going forward is base64 to guarantee shorter strings
  try {
    const base64Buffer = Buffer.from(storedHash, "base64");
    if (base64Buffer.length === 32) {
      return base64Buffer;
    }
  } catch (err) {
    logger.debug("Failed to decode base64 refresh token hash", err);
  }

  // Legacy SHA-256 hashes stored as lowercase hex (introduced in previous fix)
  try {
    const hexBuffer = Buffer.from(storedHash, "hex");
    if (hexBuffer.length === 32) {
      return hexBuffer;
    }
  } catch (err) {
    logger.debug("Failed to decode hex refresh token hash", err);
  }

  return null;
};

async function compareRefreshToken(token, storedHash) {
  if (!storedHash) return false;

  if (BCRYPT_HASH_PREFIXES.some((prefix) => storedHash.startsWith(prefix))) {
    try {
      return await bcrypt.compare(token, storedHash);
    } catch (err) {
      logger.warn("Failed to compare legacy bcrypt refresh token hash", err);
      return false;
    }
  }

  const tokenBuffer = hashRefreshToken(token);
  const storedBuffer = decodeRefreshTokenHash(storedHash);

  if (!storedBuffer || storedBuffer.length !== tokenBuffer.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(tokenBuffer, storedBuffer);
  } catch (err) {
    logger.warn("Failed to compare refresh token hash", err);
    return false;
  }
}

async function getActivePasswordResetRequests(userId) {
  return db("password_resets")
    .where({ user_id: userId, used: false })
    .andWhere("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .select("*");
}

async function findMatchingResetRecord(records, code) {
  for (const record of records) {
    if (!record?.code_hash) continue;
    const match = await bcrypt.compare(code, record.code_hash);
    if (match) {
      return record;
    }
  }
  return null;
}

function getAttemptKey(email, ip) {
  return `${LOGIN_ATTEMPT_PREFIX}${email}${ip ? `:${ip}` : ""}`;
}

function getOtpAttemptKey(userId) {
  return `${OTP_ATTEMPT_PREFIX}${userId}`;
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

async function recordFailedOtpAttempt(userId) {
  if (!redisClient) return;
  const key = getOtpAttemptKey(userId);
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

async function clearOtpAttempts(userId) {
  if (!redisClient) return;
  try {
    await redisClient.del(getOtpAttemptKey(userId));
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

  const admins = await userModel.findAdmins();
  let newUser;
  try {
    await db.transaction(async (trx) => {
      [newUser] = await userModel.insertUser(
        {
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
        },
        trx,
      );

      const roleName = data.role || "Student";
      const roleRow = await trx("roles").where({ name: roleName }).first();
      if (roleRow) {
        await trx("user_roles").insert({
          user_id: newUser.id,
          role_id: roleRow.id,
        });
      }

      const welcomeMessage =
        newUser.role && newUser.role.toLowerCase() === "instructor"
          ? "Thank you for joining our platform! Your account is under review. Please complete your profile while we review your account."
          : "Welcome to SkillBridge!";

      await notificationService.createNotification(
        {
          user_id: newUser.id,
          type: "welcome",
          message: welcomeMessage,
        },
        trx,
      );

      const firstAdmin = admins[0];
      if (firstAdmin) {
        await messageService.createMessage(
          {
            sender_id: firstAdmin.id,
            receiver_id: newUser.id,
            message: welcomeMessage,
          },
          trx,
        );
      }

      await Promise.all(
        admins.map((admin) =>
          notificationService.createNotification(
            {
              user_id: admin.id,
              type: "new_user",
              message: `New user ${newUser.full_name} (${newUser.role}) just registered`,
            },
            trx,
          ),
        ),
      );

      await Promise.all(
        admins.map((admin) =>
          messageService.createMessage(
            {
              sender_id: newUser.id,
              receiver_id: admin.id,
              message: `New user ${newUser.full_name} (${newUser.role}) just registered`,
            },
            trx,
          ),
        ),
      );
    });
  } catch (err) {
    logger.error("Failed to register user", err);
    throw err;
  }

  const roles = await userModel.getUserRoles(newUser.id);
  const permissions = await userModel.getUserPermissions(newUser.id);

  // Send emails
  try {
    await sendWelcomeEmail(newUser.email, newUser.full_name);
    await Promise.all(
      admins.map((admin) =>
        sendNewUserAdminEmail(admin.email, {
          full_name: newUser.full_name,
          email: newUser.email,
        }),
      ),
    );
  } catch (err) {
    logger.error("Error sending registration emails:", err.message);
  }

  // Queue verification email OTP sending without delaying response
  setImmediate(() => {
    verificationService
      .sendOtp(newUser.id, "email")
      .catch((err) => logger.error("Error sending verification OTP:", err));
  });

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
    recordFailedAttempt(email, ip);
    throw new AppError("Invalid credentials", 401);
  }

  if (user.status !== "active") {
    throw new AppError(
      "Account pending activation. Please verify your email or contact support.",
      403,
    );
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
  try {
    await userModel.updateUser(user.id, {
      is_online: true,
      updated_at: new Date(),
    });
  } catch (err) {
    logger.error("Failed to update user online status", err);
  }
  user.is_online = true;

  const roles = await userModel.getUserRoles(user.id);
  const permissions = await userModel.getUserPermissions(user.id);
  const tokenRoles = roles.length ? roles : [user.role];
  const primaryRole = resolvePrimaryRole(tokenRoles, user.role);
  const accessToken = generateAccessToken({
    id: user.id,
    role: primaryRole,
    roles: tokenRoles,
  });
  const refreshToken = await issueRefreshToken(user.id, tokenRoles);

  try {
    await notificationService.createNotification({
      user_id: user.id,
      type: "login",
      message: "You have logged in successfully",
    });
  } catch (err) {
    logger.error("Failed to create login notification", err);
  }
  const safeUser = sanitizeUserUtil(user);
  const canonicalRole = roles[0] || user.role;
  return {
    accessToken,
    refreshToken,
    user: { ...safeUser, role: canonicalRole, roles, permissions },
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
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

async function issueRefreshToken(userId, roles = []) {
  const roleArr = Array.isArray(roles) ? roles : [roles];
  const primaryRole = resolvePrimaryRole(roleArr);
  const jti = uuidv4();
  const token = generateRefreshToken(
    { id: userId, role: primaryRole, roles: roleArr },
    jti
  );
  const tokenHash = encodeRefreshTokenHash(hashRefreshToken(token));
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
  const match = await compareRefreshToken(token, row.token_hash);
  if (!match) throw new Error("Invalid refresh token");
  const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
  const primaryRole = resolvePrimaryRole(roles, decoded.role);
  return { ...decoded, roles, role: primaryRole };
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
    throw new AppError(
      "Too many failed OTP attempts. Try again later.",
      429
    );
  }

  const activeResets = await getActivePasswordResetRequests(user.id);
  if (!activeResets.length) {
    await recordFailedOtpAttempt(user.id);
    throw new AppError("Invalid or expired OTP", 400);
  }

  const matchingRecord = await findMatchingResetRecord(activeResets, code);
  if (!matchingRecord) {
    await recordFailedOtpAttempt(user.id);
    throw new AppError("Invalid or expired OTP", 400);
  }

  await clearOtpAttempts(user.id);
  return true;
};

/**
 * Reset a user's password using a valid OTP code.
 * @param {{email:string, code:string, new_password:string, accessToken?:string}} data
 * @returns {Promise<void>}
 */
exports.resetPassword = async ({ email, code, new_password, accessToken }) => {
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

  const activeResets = await getActivePasswordResetRequests(user.id);
  if (!activeResets.length) {
    await recordFailedOtpAttempt(user.id);
    throw new AppError("Invalid or expired OTP", 400);
  }

  const matchingRecord = await findMatchingResetRecord(activeResets, code);
  if (!matchingRecord) {
    await recordFailedOtpAttempt(user.id);
    throw new AppError("Invalid or expired OTP", 400);
  }

  const samePassword = await bcrypt.compare(new_password, user.password_hash);
  if (samePassword) {
    throw new AppError("You already used this password before", 400);
  }

  const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
  await db("users").where({ id: user.id }).update({ password_hash: hashed });

  await db("password_resets").where({ id: matchingRecord.id }).update({ used: true });

  // Revoke all refresh tokens for this user
  await db("refresh_tokens").where({ user_id: user.id }).del();

  // Optionally blacklist the provided access token
  if (accessToken) {
    try {
      await addToken(accessToken);
    } catch (err) {
      logger.error("Failed to blacklist access token", err);
    }
  }

  const warnings = [];

  try {
    await sendPasswordChangeEmail(user.email);
  } catch (err) {
    logger.error("Failed to send password change email", err);
    warnings.push({
      type: "email",
      message:
        "Password reset succeeded, but the confirmation email could not be sent.",
    });
  }

  try {
    await notificationService.createNotification({
      user_id: user.id,
      type: "security",
      message: "Your password was changed successfully",
    });
  } catch (err) {
    logger.error("Failed to create password change notification", err);
    warnings.push({
      type: "notification",
      message:
        "Password reset succeeded, but the security notification could not be recorded.",
    });
  }

  await clearOtpAttempts(user.id);
  return {
    user: sanitizeUserUtil(user),
    warnings,
  };
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

  // After verification, check if both email and phone are verified
  // and activate the user if not already active.
  const user = await userModel.findById(user_id);
  if (
    user.is_email_verified &&
    user.is_phone_verified &&
    user.status !== "active"
  ) {
    await userModel.updateUser(user_id, { status: "active" });
  }
};
