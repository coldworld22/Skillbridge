// 📁 src/modules/users/user.model.js
const db = require("../../config/database");

/**
 * 🔍 Query all users with optional search and pagination
 * - Excludes banned users
 * - Supports case-insensitive name or email search
 * - Returns basic public user fields
 */
exports.getAllUsers = async (filters) => {
  const { limit, offset } = filters;
  let query = db("users").select(
    "id",
    "full_name",
    "email",
    "role",
    "status",
    "profile_complete",
    "is_email_verified",
    "is_phone_verified",
    "avatar_url",          // ✅ Add this
    "phone",               // ✅ Optional
    "gender",              // ✅ Optional
    "date_of_birth",       // ✅ Optional
    "created_at"
  );

  if (filters.role) query.where("role", filters.role);
  if (filters.status) query.where("status", filters.status);
  if (filters.search) {
    query.andWhere((qb) => {
      qb.whereILike("full_name", `%${filters.search}%`)
        .orWhereILike("email", `%${filters.search}%`);
    });
  }

  return await query.orderBy("created_at", "desc").limit(limit).offset(offset);
};


/**
 * 📊 Count total users for pagination (excluding banned)
 */
exports.countUsers = async (search) => {
  const result = await db("users")
    .whereNot("status", "banned")
    .modify((qb) => {
      if (search) {
        qb.whereILike("full_name", `%${search}%`)
          .orWhereILike("email", `%${search}%`);
      }
    })
    .count("id as count")
    .first();

  return parseInt(result.count);
};

/**
 * 👤 Find one user by ID (used in most user-specific actions)
 */
exports.findById = (id) => {
  return db("users")
    .select(
      "id",
      "email",
      "full_name",
      "role",
      "avatar_url",
      "phone",
      "is_online",
      "status",
      "profile_complete",
      "is_email_verified",
      "is_phone_verified",
      "last_login_at",
      "last_login_ip"
    )
    .where({ id })
    .first();
};


/**
 * 📧 Find one user by email (used for login, registration, and OTP)
 */
exports.findByEmail = (email) => {
  const normalized = email.trim().toLowerCase();
  return db("users").whereRaw("LOWER(email) = ?", [normalized]).first();
};

exports.findByPhone = async (phone) => {
  return db("users").where({ phone }).first();
};

// Fetch minimal contact info for invites
exports.findContactInfo = async (id) => {
  return db("users")
    .select("id", "full_name", "email", "phone", "role")
    .where({ id })
    .first();
};

// Fetch Admin and SuperAdmin users
exports.findAdmins = () => {
  return db("users")
    .select("id", "email", "full_name")
    .whereIn("role", ["Admin", "SuperAdmin"]);
};

// Fetch Instructor users
exports.findInstructors = () => {
  return db("users")
    .select("id", "email", "full_name")
    .whereRaw("LOWER(role) = ?", ["instructor"])
    .andWhere({ status: "active" });
};

// Fetch Student users
exports.findStudents = () => {
  return db("users")
    .select("id", "email", "full_name")
    .whereRaw("LOWER(role) = ?", ["student"])
    .andWhere({ status: "active" });
};


/**
 * ➕ Insert a new user
 * - Expects pre-validated user object
 * - Returns full inserted row
 */
exports.insertUser = (data) => {
  return db("users").insert(data).returning("*");
};

/**
 * ✏️ Update an existing user
 * - Returns the updated user row
 */
exports.updateUser = (id, data) => {
  return db("users").where({ id }).update(data).returning("*");
};

/**
 * 🔁 Toggle user active/inactive status (Admin utility)
 */
exports.toggleStatus = async (id) => {
  const user = await db("users").where({ id }).first();
  const newStatus = user?.status === "active" ? "inactive" : "active";
  return db("users").where({ id }).update({ status: newStatus }).returning("*");
};

// ─────────────────────────────────────────────────────────────
// Roles Helpers
// ─────────────────────────────────────────────────────────────

exports.getUserRoles = async (userId) => {
  const rows = await db("user_roles")
    .join("roles", "user_roles.role_id", "roles.id")
    .where("user_roles.user_id", userId)
    .select("roles.name");

  if (rows.length) {
    return rows.map((r) => r.name);
  }

  const user = await db("users").where({ id: userId }).first("role");
  return user?.role ? [user.role] : [];
};

exports.getUserPermissions = async (userId) => {
  const direct = await db("user_roles")
    .join("role_permissions", "user_roles.role_id", "role_permissions.role_id")
    .join("permissions", "role_permissions.permission_id", "permissions.id")
    .where("user_roles.user_id", userId)
    .select("permissions.code");

  let codes = direct.map((r) => r.code);
  if (codes.length) {
    return [...new Set(codes)];
  }

  const user = await db("users").where({ id: userId }).first("role");
  if (!user?.role) return [];

  const role = await db("roles")
    .whereRaw("LOWER(name) = ?", [String(user.role).toLowerCase()])
    .first("id");
  if (!role) return [];

  const fallback = await db("role_permissions")
    .join("permissions", "role_permissions.permission_id", "permissions.id")
    .where("role_permissions.role_id", role.id)
    .select("permissions.code");

  codes = fallback.map((r) => r.code);
  if (codes.length) {
    return [...new Set(codes)];
  }

  const normalizedRole = String(user.role).toLowerCase();
  if (normalizedRole === "superadmin") {
    const allCodes = await exports.getAllPermissionCodes();
    return [...new Set(allCodes)];
  }

  if (normalizedRole === "admin") {
    const viewCodes = await db("permissions")
      .whereLike("code", "view_%")
      .pluck("code");
    return [...new Set(viewCodes)];
  }

  return [];
};

exports.getAllPermissionCodes = async () => {
  const rows = await db("permissions").select("code");
  return rows.map((r) => r.code);
};

exports.setUserRoles = async (userId, roleIds) => {
  await db("user_roles").where({ user_id: userId }).del();
  if (roleIds.length) {
    const rows = roleIds.map((rid) => ({ user_id: userId, role_id: rid }));
    await db("user_roles").insert(rows);
  }
  return exports.getUserRoles(userId);
};

// ─────────────────────────────────────────────────────────────
// Social Accounts Helpers
// ─────────────────────────────────────────────────────────────

exports.findBySocialAccount = (provider, providerId) => {
  return db("social_accounts")
    .where({ provider, provider_id: providerId })
    .first();
};

exports.addSocialAccount = (userId, provider, providerId, email) => {
  return db("social_accounts").insert({
    user_id: userId,
    provider,
    provider_id: providerId,
    email,
    created_at: new Date(),
  });
};
