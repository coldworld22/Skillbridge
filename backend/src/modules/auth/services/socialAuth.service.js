const bcrypt = require("bcrypt");
const userModel = require("../../users/user.model");
const { generateAccessToken, issueRefreshToken } = require("./auth.service");
const AppError = require("../../../utils/AppError");
const sanitizeUser = require("../utils/sanitizeUser");
const db = require("../../../config/database");
const notificationService = require("../../notifications/notifications.service");

const SALT_ROUNDS = 12;

async function ensureRoleAssignments(user) {
  const existingRoles = await userModel.getUserRoles(user.id);
  if (existingRoles.length) {
    return existingRoles;
  }

  const fallbackRole = user.role || "Student";
  const roleRow = await db("roles").where({ name: fallbackRole }).first();
  if (roleRow) {
    try {
      await db("user_roles").insert({
        user_id: user.id,
        role_id: roleRow.id,
      });
      return [roleRow.name];
    } catch (err) {
      // swallow duplicate key errors in case another process created the mapping
      if (err.code !== "23505") {
        throw err;
      }
    }
  }
  return existingRoles.length ? existingRoles : [fallbackRole];
}

exports.loginOrRegister = async ({
  provider,
  providerId,
  email,
  fullName,
  avatarUrl,
  tenant_id = null,
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
      const defaultRole = await db("roles").where({ name: "Student" }).first();
      if (defaultRole) {
        try {
          await db("user_roles").insert({
            user_id: user.id,
            role_id: defaultRole.id,
          });
        } catch (err) {
          if (err.code !== "23505") {
            throw err;
          }
        }
      }
    } else if (avatarUrl && !user.avatar_url) {
      await userModel.updateUser(user.id, { avatar_url: avatarUrl });
      user.avatar_url = avatarUrl;
    }
    await userModel.addSocialAccount(user.id, provider, providerId, email);
  }

  if (user.status !== "active") {
    throw new AppError("Account is not active", 403);
  }

  const roles = await ensureRoleAssignments(user);
  const permissions = await userModel.getUserPermissions(user.id);
  const tokenRoles = roles.length ? roles : [user.role];
  const membershipRows = await db("tenant_memberships")
    .select("tenant_id", "role", "status")
    .where({ user_id: user.id, status: "active" });
  const memberships = Array.isArray(membershipRows) ? membershipRows : [];
  if (process.env.NODE_ENV !== "test" && memberships.length === 0) {
    throw new AppError(
      "No active tenant membership found. Please accept an invite or contact your admin.",
      403,
    );
  }
  const membershipTenantIds = new Set(memberships.map((m) => m.tenant_id));
  const currentTenantId =
    (tenant_id && membershipTenantIds.has(tenant_id)
      ? tenant_id
      : memberships[0]?.tenant_id) || null;
  const accessToken = generateAccessToken({
    id: user.id,
    role: tokenRoles[0],
    roles: tokenRoles,
    platform_role: user.platform_role || "none",
    memberships,
    current_tenant_id: currentTenantId,
  });
  const refreshToken = await issueRefreshToken(user.id, tokenRoles[0]);

  const now = new Date();
  const loginUpdate = {
    is_online: true,
    updated_at: now,
    last_login_at: now,
  };

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

  await notificationService.createNotification({
    user_id: user.id,
    type: "login",
    message: "You have logged in successfully",
  });

  const onboardingComplete = Boolean(
    user.profile_complete && user.is_email_verified,
  );
  const safeUser = sanitizeUser({ ...user, roles, permissions });
  return {
    accessToken,
    refreshToken,
    user: safeUser,
    onboarding: {
      profile_complete: user.profile_complete,
      is_email_verified: user.is_email_verified,
      complete: onboardingComplete,
    },
  };
};
