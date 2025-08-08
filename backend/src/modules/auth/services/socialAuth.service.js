const bcrypt = require("bcrypt");
const userModel = require("../../users/user.model");
const { generateAccessToken, issueRefreshToken } = require("./auth.service");
const AppError = require("../../../utils/AppError");
const sanitizeUser = require("../utils/sanitizeUser");

const SALT_ROUNDS = 12;

exports.loginOrRegister = async ({
  provider,
  providerId,
  email,
  fullName,
  avatarUrl,
}) => {
  let account = await userModel.findBySocialAccount(provider, providerId);
  let user;

  if (account) {
    user = await userModel.findById(account.user_id);
  } else {
    // if email matches existing user, link account
    if (email) {
      const existing = await userModel.findByEmail(email);
      if (existing) {
        user = existing;
      }
    }
    if (!user) {
      const hashed = await bcrypt.hash(providerId, SALT_ROUNDS);
      const [newUser] = await userModel.insertUser({
        full_name: fullName || "User",
        email: email || `${providerId}@${provider}.local`,
        phone: null,
        password_hash: hashed,
        role: "Student",
        status: "active",
        is_email_verified: !!email,
        is_phone_verified: false,
        profile_complete: false,
        avatar_url: avatarUrl || null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      user = newUser;
    } else if (avatarUrl && !user.avatar_url) {
      await userModel.updateUser(user.id, { avatar_url: avatarUrl });
      user.avatar_url = avatarUrl;
    }
    await userModel.addSocialAccount(user.id, provider, providerId, email);
  }

  if (user.status !== "active") {
    throw new AppError("Account is not active", 403);
  }

  const roles = await userModel.getUserRoles(user.id);
  const tokenRoles = roles.length ? roles : [user.role];
  const accessToken = generateAccessToken({ id: user.id, role: tokenRoles[0], roles: tokenRoles });
  const refreshToken = await issueRefreshToken(user.id, tokenRoles[0]);

  const safeUser = sanitizeUser({ ...user, roles });
  return { accessToken, refreshToken, user: safeUser };
};
