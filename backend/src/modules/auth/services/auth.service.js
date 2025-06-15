const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const userModel = require("../../users/user.model");
const db = require("../../../config/database");
const { sendOtpEmail } = require("../../../utils/email");
const AppError = require("../../../utils/AppError");

// ─────────────────────────────────────────────────────────────
// 🔧 Config Constants
// ─────────────────────────────────────────────────────────────
const SALT_ROUNDS = 12;
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";
const OTP_EXPIRY_MINUTES = 10;

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

  const accessToken = generateAccessToken({ id: newUser.id, role: roles[0], roles });
  const refreshToken = generateRefreshToken({ id: newUser.id });

  return { accessToken, refreshToken, user: { ...newUser, roles } };
};


/**
 * Login user and issue tokens
 */
exports.loginUser = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("Invalid credentials", 401);

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new AppError("Invalid credentials", 401);

  const roles = await userModel.getUserRoles(user.id);
  const accessToken = generateAccessToken({ id: user.id, role: roles[0], roles });
  const refreshToken = generateRefreshToken({ id: user.id });

  return { accessToken, refreshToken, user: { ...user, roles } };
};

/**
 * Generate JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

/**
 * Verify JWT refresh token
 */
exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate OTP for password reset and send to user's email
 */
exports.generateOtp = async (email) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("User not found", 404);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

  await db("password_resets").insert({
    id: uuidv4(),
    user_id: user.id,
    code,
    expires_at: expires,
    used: false,
    created_at: new Date(),
  });

  await sendOtpEmail(email, code);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] Sent code ${code} to ${email}`);
  }
};

/**
 * Validate OTP
 */
exports.verifyOtp = async ({ email, code }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("Invalid user", 400);

  const record = await db("password_resets")
    .where({ user_id: user.id, code, used: false })
    .andWhere("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .first();

  if (!record) throw new AppError("Invalid or expired OTP", 400);
  return true;
};

/**
 * Reset user password using OTP
 */
exports.resetPassword = async ({ email, code, new_password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("User not found", 404);

  const resetRecord = await db("password_resets")
    .where({ user_id: user.id, code, used: false })
    .andWhere("expires_at", ">", new Date())
    .first();

  if (!resetRecord) throw new AppError("Invalid or expired OTP", 400);

  const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
  await db("users").where({ id: user.id }).update({ password_hash: hashed });

  await db("password_resets").where({ id: resetRecord.id }).update({ used: true });
};
