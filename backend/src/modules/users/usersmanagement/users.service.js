// 📁 modules/users/usersmanagment/users.service.js

const db = require("../../../config/database");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../../utils/AppError");

/**
 * Update user status (active, inactive, suspended)
 */
exports.updateUserStatus = async (id, status) => {
  await db("users").where({ id }).update({ status });
  return { id, status };
};

/**
 * Get user by ID
 */
exports.getUserById = async (id) => {
  return await db("users").where({ id }).first();
};

/**
 * Reset user password (generate random password, hash it)
 */
exports.resetUserPassword = async (id) => {
  const newPassword = uuidv4().slice(0, 10);
  const hashed = await bcrypt.hash(newPassword, 10);
  await db("users").where({ id }).update({ password: hashed });
  return newPassword;
};

/**
 * Update user profile (partial fields)
 */
exports.updateUserProfile = async (id, data) => {
  await db("users").where({ id }).update({
    ...data,
    updated_at: new Date(),
  });
  return await db("users").where({ id }).first();
};


exports.createUser = async (data) => {
  const {
    full_name,
    email,
    phone,
    password_hash,
    role,
    gender,
    date_of_birth,
  } = data;

  // Check duplicate email
  const existingEmail = await db("users").where({ email }).first();
  if (existingEmail) {
    throw new AppError("Email is already in use", 409);
  }

  // Check duplicate phone number
  const existingPhone = await db("users").where({ phone }).first();
  if (existingPhone) {
    throw new AppError("Phone number is already in use", 409);
  }

  const [user] = await db("users")
    .insert({
      id: uuidv4(),
      full_name,
      email,
      phone,
      password_hash,
      role,
      gender,
      date_of_birth,
      is_email_verified: false,
      is_phone_verified: false,
      profile_complete: false,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning("*");

  return user;
};


exports.updateUserProfile = async (id, data) => {
  await db("users").where({ id }).update({
    ...data,
    updated_at: new Date(),
  });
  return await db("users").where({ id }).first();
};




/**
 * Change user role
 */
exports.changeUserRole = async (id, role) => {
  const roleRow = await db("roles").where({ name: role }).first();
  if (!roleRow) throw new AppError("Role not found", 404);
  await db("users").where({ id }).update({ role }); // keep legacy column updated
  await db("user_roles").where({ user_id: id }).del();
  await db("user_roles").insert({ user_id: id, role_id: roleRow.id });
  return { id, role };
};

/**
 * Update user avatar
 */
exports.updateUserAvatar = async (id, avatar_url) => {
  await db("users").where({ id }).update({
    avatar_url,
    updated_at: new Date(),
  });
  return { id, avatar_url };
};

/**
 * Remove identity document URL
 */
exports.removeUserIdentity = async (id) => {
  await db("users").where({ id }).update({
    identity_doc_url: null,
    updated_at: new Date(),
  });
};

/**
 * Restore user (assumes soft delete with `deleted_at`)
 */
exports.restoreUser = async (id) => {
  await db("users").where({ id }).update({ deleted_at: null });
  return await db("users").where({ id }).first();
};

/**
 * Bulk update statuses for multiple users
 */
exports.bulkUpdateStatus = async (ids, status) => {
  await db("users").whereIn("id", ids).update({ status });
};

/**
 * Bulk delete multiple users
 */
exports.bulkDeleteUsers = async (ids) => {
  await db("users").whereIn("id", ids).del();
};
