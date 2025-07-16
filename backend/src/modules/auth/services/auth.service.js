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
const { OTP_LENGTH } = require("../constants");
const AppError = require("../../../utils/AppError");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");

// ─────────────────────────────────────────────────────────────
// 🔧 Config Constants
// ─────────────────────────────────────────────────────────────
const SALT_ROUNDS = 12;
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";
const OTP_EXPIRY_MINUTES = 15;

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
  const tokenRoles = roles.length ? roles : [newUser.role];

  const accessToken = generateAccessToken({ id: newUser.id, role: tokenRoles[0], roles: tokenRoles });
  const refreshToken = generateRefreshToken({ id: newUser.id });

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
    console.error("Error sending registration emails:", err.message);
  }

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

  if (user.role && user.role.toLowerCase() === "instructor") {
    await userModel.updateUser(user.id, { is_online: true });
    user.is_online = true;
  }

  const roles = await userModel.getUserRoles(user.id);
  const tokenRoles = roles.length ? roles : [user.role];
  const accessToken = generateAccessToken({ id: user.id, role: tokenRoles[0], roles: tokenRoles });
  const refreshToken = generateRefreshToken({ id: user.id });

  await notificationService.createNotification({
    user_id: user.id,
    type: "login",
    message: "You have logged in successfully",
  });

  return { accessToken, refreshToken, user: { ...user, roles } };
};

/**
 * Generate JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

exports.generateAccessToken = generateAccessToken;

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

exports.generateRefreshToken = generateRefreshToken;

/**
 * Verify JWT refresh token
 */
exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate OTP for password reset and email it to the user.
 * @param {string} email - User email address
 * @returns {Promise<void>}
 */
exports.generateOtp = async (email) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("Email not found", 404);

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

  await sendOtpEmail(email, code);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] Sent code ${code} to ${email}`);
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


  await messageService.createMessage({
    sender_id: user.id,
    receiver_id: user.id,
    message: "Your password was changed successfully",
  });

};
