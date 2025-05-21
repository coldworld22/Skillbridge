const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const userModel = require("../users/user.model");
const db = require("../../config/database");
const { sendOtpEmail } = require("../../utils/email");

/**
 * Register a new user with role "Student"
 */
exports.registerUser = async (data) => {
  const existing = await userModel.findByEmail(data.email);
  if (existing) throw new Error("Email already in use");

  const hashed = await bcrypt.hash(data.password, 12);

  const newUser = await userModel.insertUser({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    password_hash: hashed,
    role: "Student", // or allow custom role from frontend
    status: "active",
    is_email_verified: false,
    is_phone_verified: false,
    profile_complete: false,
    created_at: new Date(),
    updated_at: new Date(),
  });


  const accessToken = this.generateAccessToken({ id: newUser[0].id, role: newUser[0].role });
  const refreshToken = this.generateRefreshToken({ id: newUser[0].id });

  return { accessToken, refreshToken, user: newUser[0] };
};

/**
 * Authenticate user by email and password
 */
exports.loginUser = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error("Invalid credentials");

  const accessToken = this.generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = this.generateRefreshToken({ id: user.id });

  return { accessToken, refreshToken, user };
};

/**
 * Generate short-lived access token
 */
exports.generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
};

/**
 * Generate long-lived refresh token
 */
exports.generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

/**
 * Validate a refresh token and return decoded payload
 */
exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate a 6-digit OTP for password reset
 * Sends OTP to the user's email
 */
exports.generateOtp = async (email) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new Error("User not found");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60000); // 10 minutes

  // Insert OTP into database
  await db("password_resets").insert({
    id: uuidv4(),
    user_id: user.id,
    code,
    expires_at: expires,
    used: false,
    created_at: new Date(),
  });

  // Send OTP via email
  await sendOtpEmail(email, code);  // Send the OTP to the user

  console.log(`[OTP] Sent code ${code} to ${email}`); // For debugging, replace with real email delivery logic
};

/**
 * Verify the submitted OTP code
 */
exports.verifyOtp = async ({ email, code }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new Error("Invalid user");

  const record = await db("password_resets")
    .where({ user_id: user.id, code, used: false })
    .andWhere("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .first();

  if (!record) throw new Error("Invalid or expired OTP");
  return true;
};

/**
 * Reset the user's password using valid OTP
 */
exports.resetPassword = async ({ email, code, new_password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new Error("User not found");

  const resetRecord = await db("password_resets")
    .where({ user_id: user.id, code, used: false })
    .andWhere("expires_at", ">", new Date())
    .first();

  if (!resetRecord) throw new Error("Invalid or expired OTP");

  const hashed = await bcrypt.hash(new_password, 12);
  await db("users").where({ id: user.id }).update({ password_hash: hashed });

  await db("password_resets").where({ id: resetRecord.id }).update({ used: true });
};