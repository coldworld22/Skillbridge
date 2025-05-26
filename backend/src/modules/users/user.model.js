// 📁 src/modules/users/user.model.js
const db = require("../../config/database");

/**
 * 🔍 Query all users with optional search and pagination
 * - Excludes banned users
 * - Supports case-insensitive name or email search
 * - Returns basic public user fields
 */
exports.queryUsers = ({ search, limit = 10, offset = 0 }) => {
  return db("users")
    .select("id", "full_name", "email", "role", "status", "profile_complete","is_email_verified", "is_phone_verified", "created_at")
    .whereNot("status", "banned")
    .modify((qb) => {
      if (search) {
        qb.whereILike("full_name", `%${search}%`)
          .orWhereILike("email", `%${search}%`);
      }
    })
    .limit(limit)
    .offset(offset)
    .orderBy("created_at", "desc");
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
