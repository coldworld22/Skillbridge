// 📁 src/modules/users/user.model.js
const db = require("../../config/database");

/**
 * 🔍 Query all users with optional search and pagination
 * - Excludes banned users
 * - Supports case-insensitive name or email search
 * - Returns basic public user fields
 */
exports.getAllUsers = async (filters) => {
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

  return await query.orderBy("created_at", "desc");
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
      "status",
      "profile_complete",
      "is_email_verified",
      "is_phone_verified"
    )
    .where({ id })
    .first();
};


/**
 * 📧 Find one user by email (used for login, registration, and OTP)
 */
exports.findByEmail = (email) => {
  return db("users").where({ email }).first();
};

exports.findByPhone = async (phone) => {
  return db("users").where({ phone }).first();
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
  return rows.map((r) => r.name);
};

exports.setUserRoles = async (userId, roleIds) => {
  await db("user_roles").where({ user_id: userId }).del();
  if (roleIds.length) {
    const rows = roleIds.map((rid) => ({ user_id: userId, role_id: rid }));
    await db("user_roles").insert(rows);
  }
  return exports.getUserRoles(userId);
};
